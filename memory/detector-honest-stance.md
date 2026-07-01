---
name: detector-honest-stance
description: Decision to keep the AI detector conservative/honest rather than aggressive
metadata:
  type: project
---

The AI text detector (src/lib/detector) is deliberately kept **conservative/honest**, not aggressive. Verdict thresholds are `±0.18` and the optional Phase-4 model score (`DETECTOR_MODEL_SCORE`) stays **off** by default.

**Why:** The eval harness (src/lib/detector/eval.ts against __fixtures__/corpus.ts) shows humanized/paraphrased AI scores *lower* than real non-native-human English, so any threshold aggressive enough to catch that AI would flag non-native speakers as AI first. That's the exact harm the /detector page copy promises to avoid (it cites detector false-positive rates and the Stanford non-native-speaker finding). Priority order: **human false-positive rate = 0 first, AI recall second.**

**How to apply:** When improving the detector, optimize AI recall *subject to* zero human false positives — do not lower thresholds or enable the model score without the user's explicit sign-off, and update the disclaimer copy if determinism/reproducibility ever changes. Re-run `npx tsx src/lib/detector/eval.ts` after any signal/threshold change.
