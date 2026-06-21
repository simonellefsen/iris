# Experiments

Ideas under test that haven't earned a `decisions/` entry yet: prompt tuning, model comparisons,
scoring-rubric calibration, UX bets. Each experiment should record a hypothesis, method, result,
and a conclusion (promote → decision, or drop).

## Template

```markdown
# Experiment: <short title>
**Date**: YYYY-MM-DD · **Status**: open | concluded

## Hypothesis
<what you expect and why>

## Method
<models / prompts / fixtures / how measured>

## Result
<what happened>

## Conclusion
<promote to a decision, iterate, or drop>
```

## Candidate experiments (backlog)

- **Vision model comparison** — same photo + brief across Gemini 2.x / GPT-4o / Claude Sonnet /
  Grok; do rubric scores agree? Calibrate the per-provider `visionQuality` hint.
- **Task-prompt temperature** — current task gen uses `temp 0.8` (eval `0.3`). Does lower temp give
  more feasible, less repetitive briefs?
- **Downscale size vs. eval quality** — is 1568px overkill? Find the smallest size that doesn't hurt
  scoring, to save quota/bandwidth.
- **Feasibility-clamp frequency** — log how often `enforceFeasibility` actually changes a value; a
  high rate means the prompt needs better rig context.
