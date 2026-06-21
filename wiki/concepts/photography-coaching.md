# Concept: the photography coaching loop

Iris is a **coach**, not a gallery or a filter app. The whole product is one loop:

```
context  →  task  →  shoot  →  evaluate  →  learn
```

1. **Context** — where you are, what the light is doing, what the weather is. This is the raw
   material a good photo brief is built on. Golden hour by the water demands a different task than
   overcast noon in a city street. See [context APIs](../sources/context-apis.md).
2. **Task** — an LLM designs a *single, specific, feasible* assignment for the current moment and
   the user's rig: an objective, technique tags, hard numeric constraints (focal length, aperture,
   shutter floor, ISO cap), a suggested exposure, success criteria, and coaching hints. Feasibility
   is enforced in code, not left to the model — see
   [gear-capability-model.md](gear-capability-model.md).
3. **Shoot** — the user takes the photo on their real camera (or phone) and gets it into the app.
4. **Evaluate** — a vision LLM grades the submitted photo against the brief on a fixed rubric
   (Composition, Exposure/Technical, Constraint Adherence, Creativity), with rationale, strengths,
   improvements, and any constraint violations.
5. **Learn** — the score + feedback land in history so the photographer can see progress over time.

## Why a rubric (not just a score)

A bare number teaches nothing. The four-dimension rubric forces the model to say *why*, and to
separate "is this a good photo" (composition, creativity) from "did you do the assignment"
(constraint adherence, exposure/technical). The brief carries explicit `successCriteria` so grading
is anchored to the task, not the grader's taste.

## Design tensions

- **Encouraging but honest.** The eval system prompt is "strict-but-encouraging": real critique,
  no flattery, but framed for someone learning.
- **Feasible by construction.** The single biggest failure mode is a brief the user's gear can't
  satisfy (f/1.8 on a kit zoom). Code clamps every numeric constraint to the rig before the task is
  ever shown. See [decisions/2026-06-20-camera-ingest-via-exif.md](../decisions/2026-06-20-camera-ingest-via-exif.md)
  for why EXIF is how we know what gear was actually used.
- **One task at a time.** The loop is deliberately small and repeatable; gamification/streaks are a
  later phase, layered on top of this core.
