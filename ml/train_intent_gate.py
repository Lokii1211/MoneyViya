"""
Train Viya's intent-gate model (action vs not-an-action)
=========================================================
Our own model, trained on our own data (tests/data/intent_dataset.jsonl).
sklearn/numpy are used HERE only, offline. The output is a plain JSON of
weights that runs in production with pure Python and no dependencies — see
frontend/api/_intent_gate.py, whose featurize() this script imports so the
feature space is identical on both sides.

Run:  python3 ml/train_intent_gate.py
Writes: frontend/api/intent_gate_model.json

Reports real 5-fold cross-validated accuracy (no leakage — vocab/idf are
rebuilt on each training fold) plus the precision of the "not-an-action"
decision, and picks the confidence threshold at which that decision is
>=95% precise. That threshold is what makes it safe to act on.
"""

import os
import sys
import json
import math
from collections import Counter

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "frontend", "api"))
from _intent_gate import featurize  # noqa: E402  — the SAME featurizer production uses

DATASET = os.path.join(ROOT, "tests", "data", "intent_dataset.jsonl")
OUT = os.path.join(ROOT, "frontend", "api", "intent_gate_model.json")
MIN_DF = 2          # drop features seen in only one message (noise on a small set)
C = 4.0             # LogisticRegression inverse-regularization
TARGET_PRECISION = 0.95


def load():
    msgs, y = [], []
    with open(DATASET, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            msgs.append(row["message"])
            y.append(1 if row.get("intent") else 0)   # 1 = should log an action, 0 = question/none
    return msgs, np.array(y)


def build_vocab(feats_list, min_df):
    df = Counter()
    for feats in feats_list:
        for tok in feats:
            df[tok] += 1
    vocab = {}
    for tok in df:
        if df[tok] >= min_df:
            vocab[tok] = len(vocab)
    n = len(feats_list)
    idf = np.zeros(len(vocab))
    for tok, j in vocab.items():
        idf[j] = math.log((1 + n) / (1 + df[tok])) + 1.0
    return vocab, idf


def build_matrix(feats_list, vocab, idf):
    x = np.zeros((len(feats_list), len(vocab)))
    for i, feats in enumerate(feats_list):
        for tok, cnt in feats.items():
            j = vocab.get(tok)
            if j is not None:
                x[i, j] = cnt * idf[j]
    norms = np.linalg.norm(x, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return x / norms


def main():
    msgs, y = load()
    feats_list = [featurize(m) for m in msgs]
    n = len(msgs)
    print(f"Dataset: {n} messages | {int(y.sum())} action / {int((1 - y).sum())} not-an-action")

    # ── Honest 5-fold CV: rebuild vocab/idf on each training fold only ──
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    oof_p = np.zeros(n)
    fold_acc = []
    for tr, va in skf.split(msgs, y):
        vocab, idf = build_vocab([feats_list[i] for i in tr], MIN_DF)
        x_tr = build_matrix([feats_list[i] for i in tr], vocab, idf)
        x_va = build_matrix([feats_list[i] for i in va], vocab, idf)
        clf = LogisticRegression(class_weight="balanced", C=C, solver="liblinear", max_iter=3000)
        clf.fit(x_tr, y[tr])
        oof_p[va] = clf.predict_proba(x_va)[:, 1]
        fold_acc.append(clf.score(x_va, y[va]))

    acc = float(((oof_p >= 0.5).astype(int) == y).mean())
    # Precision/recall of the "not-an-action" class (label 0) at the 0.5 boundary.
    pred0 = oof_p < 0.5
    true0 = y == 0
    tp0 = int((pred0 & true0).sum())
    prec0 = tp0 / max(int(pred0.sum()), 1)
    rec0 = tp0 / max(int(true0.sum()), 1)
    print(f"\n5-fold CV accuracy:        {acc * 100:.1f}%  (per-fold {[round(a, 3) for a in fold_acc]})")
    print(f"'not-an-action' precision: {prec0 * 100:.1f}%   recall: {rec0 * 100:.1f}%  (at 0.5)")

    # ── Pick the confidence threshold at which "not-an-action" is >=95% precise.
    # Largest P(action) cutoff t such that among messages with P<t, >=95% truly
    # are not-an-action. That's the point where it's safe to let the gate act. ──
    threshold_low = 0.0
    coverage = 0
    for t in sorted(set(np.round(oof_p, 4))):
        mask = oof_p < t
        if mask.sum() < 4:
            continue
        precision = (y[mask] == 0).mean()
        if precision >= TARGET_PRECISION:
            threshold_low = float(t)
            coverage = int((mask & true0).sum())
    caught_pct = 100 * coverage / max(int(true0.sum()), 1)
    print(f"\nGate threshold_low = {threshold_low:.3f}  →  when P(action) < this, the message is")
    print(f"  not-an-action with >= {TARGET_PRECISION*100:.0f}% precision, catching {coverage}/{int(true0.sum())} "
          f"({caught_pct:.0f}%) of not-an-action messages with near-zero false suppression.")

    # ── Final fit on ALL data → export weights ──
    vocab, idf = build_vocab(feats_list, MIN_DF)
    x = build_matrix(feats_list, vocab, idf)
    clf = LogisticRegression(class_weight="balanced", C=C, solver="liblinear", max_iter=3000)
    clf.fit(x, y)
    model = {
        "version": 1,
        "task": "action_gate",
        "trained_on": os.path.relpath(DATASET, ROOT),
        "n_examples": n,
        "vocab": vocab,
        "idf": [round(v, 6) for v in idf.tolist()],
        "coef": [round(v, 6) for v in clf.coef_[0].tolist()],
        "intercept": round(float(clf.intercept_[0]), 6),
        "threshold_low": round(threshold_low, 4),
        "cv": {"accuracy": round(acc, 4), "not_action_precision": round(prec0, 4),
               "not_action_recall": round(rec0, 4), "coverage": coverage},
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(model, f)
    size_kb = os.path.getsize(OUT) / 1024
    print(f"\nWrote {OUT}  ({len(vocab)} features, {size_kb:.0f} KB) — pure-Python inference, no deps.")


if __name__ == "__main__":
    main()
