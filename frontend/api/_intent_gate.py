"""
Viya — Intent Gate: our own trained model (no API, no heavy deps)
==================================================================
A small linear classifier, TRAINED BY US on tests/data/intent_dataset.jsonl
(see ml/train_intent_gate.py), that answers one high-value question: is this
message a NEW logging/create action, or a question / confirmation / plain
talk? It's the "don't re-log when the user is just asking" problem, backed by
a model we own instead of only prompt rules.

Design choice that matters: featurize() lives HERE and is imported by the
trainer, so training and production featurize identically (no sklearn/numpy
mismatch). The trainer fits the weights with sklearn offline; production loads
a plain JSON of {vocab, idf, coef, intercept} and does the dot product in pure
Python — so this runs inside the Vercel function with NO new dependency and NO
network call. If the model file is missing, everything no-ops (returns None)
and the caller falls back to the prompt/duplicate guards alone.
"""

import os
import re
import json
import math

_WORD_RE = re.compile(r"[a-z0-9]+")
_MODEL = None
_LOADED = False


def featurize(text):
    """text -> {feature_token: count}. Deterministic, pure-Python, shared by
    the trainer and production so the feature space is identical on both sides.
    Word uni/bigrams (Latin/transliterated tokens) + char 3–5 grams over the
    raw lowercased text (which also captures Devanagari/Tamil/etc. scripts)."""
    text = (text or "").lower().strip()
    feats = {}
    words = _WORD_RE.findall(text)
    for i, w in enumerate(words):
        feats[f"w:{w}"] = feats.get(f"w:{w}", 0) + 1
        if i + 1 < len(words):
            bg = f"w:{w}_{words[i + 1]}"
            feats[bg] = feats.get(bg, 0) + 1
    s = f" {text} "
    for n in (3, 4, 5):
        for i in range(len(s) - n + 1):
            g = f"c:{s[i:i + n]}"
            feats[g] = feats.get(g, 0) + 1
    return feats


def _load():
    global _MODEL, _LOADED
    if _LOADED:
        return _MODEL
    _LOADED = True
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "intent_gate_model.json")
    try:
        with open(path, encoding="utf-8") as f:
            _MODEL = json.load(f)
    except Exception:
        _MODEL = None
    return _MODEL


def action_probability(text):
    """P(message is a genuine logging/create action), in [0, 1]. None if the
    model file isn't present. Reproduces the trainer's TF-IDF (count * idf,
    L2-normalized) exactly, then applies the linear model + sigmoid."""
    model = _load()
    if not model:
        return None
    vocab = model["vocab"]
    idf = model["idf"]
    coef = model["coef"]
    feats = featurize(text)
    # TF-IDF vector over known vocab, then L2 normalize (matches training).
    vals = {}
    norm_sq = 0.0
    for tok, cnt in feats.items():
        j = vocab.get(tok)
        if j is None:
            continue
        v = cnt * idf[j]
        vals[j] = v
        norm_sq += v * v
    if norm_sq <= 0:
        # No known features — undecidable; treat as "could be an action" so we
        # never suppress on an empty signal.
        return None
    norm = math.sqrt(norm_sq)
    z = model["intercept"]
    for j, v in vals.items():
        z += (v / norm) * coef[j]
    return 1.0 / (1.0 + math.exp(-z))


def not_an_action(text):
    """True only when the model is CONFIDENT this message is not a new action
    (P below the trained low threshold). Conservative by construction — used
    as a second opinion to strengthen the LOG-vs-ASK / duplicate guards, never
    to override a confident log. Returns False whenever the model is absent or
    unsure, so callers fail open."""
    model = _load()
    if not model:
        return False
    p = action_probability(text)
    if p is None:
        return False
    return p < model.get("threshold_low", 0.15)
