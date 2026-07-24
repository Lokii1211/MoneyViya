# ml/ — Viya's own trained models

This is where Viya has a model **we train on our own data**, not an API call.

## What's trained today: the intent gate

`train_intent_gate.py` trains a linear classifier on
`tests/data/intent_dataset.jsonl` that answers one high-value question:
**is this message a new logging/create action, or a question / confirmation /
plain talk?** — i.e. the "don't re-log when the user is just asking" problem,
backed by a model we own instead of only prompt rules.

```
python3 ml/train_intent_gate.py
# → writes frontend/api/intent_gate_model.json
```

### How it's deployed with zero dependencies
sklearn/numpy are used **only here, offline**, to fit the weights. The output
is a plain JSON of `{vocab, idf, coef, intercept, threshold_low}`. Production
(`frontend/api/_intent_gate.py`) loads that JSON and does the TF-IDF + logistic
dot-product in **pure Python** — no sklearn, no numpy, no network in the
serverless function. The featurizer lives in `_intent_gate.py` and is imported
by the trainer, so training and production featurize identically (no drift).

### Measured performance (honest, held-out)
5-fold cross-validation, vocab/idf rebuilt per fold (no leakage):
- **~84% accuracy** on the raw action-vs-not-action call.
- That alone isn't good enough to override the 70B LLM, so it's used
  **conservatively**: it only acts below `threshold_low`, the point where its
  "not-an-action" call is **≥95% precise** — catching ~40% of question/
  confirmation messages with near-zero false suppression.

### How it's used
In `chat.py` / `whatsapp.py`, if the LLM emits a logging action **but** the gate
is high-confidence the message is a question, the write is suppressed (the
irreversible harm) and a false "logged!" reply is corrected. A genuine answer is
never clobbered. It's a second opinion layered on the prompt rule + the
`recent_duplicate()` guard — three independent defenses against phantom logs.

### Retrain when the dataset grows
Add rows to `tests/data/intent_dataset.jsonl` (especially real messages the gate
or LLM got wrong), then re-run the trainer. Accuracy and the safe threshold both
improve as the corpus grows — that's the "training" loop for this model.

---

## The bigger ask: fine-tuning our own LLM — the honest path

Fine-tuning a small open model (e.g. LLaMA 3.1 8B or a 1–3B model, via LoRA/
QLoRA) to do the action-extraction itself is a **real** option, and would give
an owned model that's cheaper, faster, and not rate-limited like the Groq API.
It is not something that can be faked or done in-repo, so here's what it
actually takes, honestly:

1. **Data** — a few thousand `(message → exact ACTION lines + reply)` pairs.
   We have the *intents* labelled (`intent_dataset.jsonl`) but not gold
   ACTION+reply targets yet. Step one is building that set (hand-written +
   distilled from the current 70B model's good outputs, human-checked).
2. **Compute** — a GPU. Realistically a fine-tuning service (Together,
   Fireworks, Replicate, or OpenAI's fine-tuning) rather than self-hosting.
3. **Hosting** — the tuned model needs an inference endpoint (the same services
   host it). Groq does **not** offer fine-tuning, so this moves that step off
   Groq.
4. **Eval** — run `tests/eval_rag.py` against the tuned model exactly as against
   the current one, and only switch if it wins on the same dataset.

This is a worthwhile project once there's usage to distil from — but it's weeks
of data work + real cost, and it would **not** fix the current accuracy issues,
which are prompt + retrieval + guard logic (already addressed). The intent gate
above is the piece of "our own trained model" that's genuinely worth having
*now*; LLM fine-tuning is a later, deliberate investment, not a quick swap.
