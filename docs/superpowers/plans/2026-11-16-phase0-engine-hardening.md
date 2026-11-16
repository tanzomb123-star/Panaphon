# Phase 0: Engine Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `video-engine/` from a single hand-drawn demo into a data-driven engine: validated story files, a declarative character rig with 10 characters, 10 styles, stronger QA, golden-frame tests and parallel rendering.

**Architecture:** Shared modules (`rig.js`, `characters.js`, `styles.js`, `props.js`) are plain UMD files loaded both by Node (validation, tests) and by the Chromium page (`stage.js`). Every frame stays a pure function of `t`. Node-side tools (`schema.cjs`, `qa.cjs`, `render.cjs`) validate before rendering and check pixels after.

**Tech Stack:** Node 22 (CJS), Playwright Chromium (preinstalled), ffmpeg 6, zod 3, pngjs 7, pixelmatch 5 (CJS), `node:test`.

**Spec:** `docs/APP_PLAN.md`, section "เฟส 0"

## Global Constraints
- Node 22, CommonJS (`.cjs` for Node entry points); no TypeScript build step in phase 0.
- Shared modules must run unchanged in browser and Node: `(function (root) {...; if (typeof module !== 'undefined') module.exports = X; else root.X = X;})(this)`.
- Frame output must be deterministic: no `Math.random()`/`Date.now()` in drawing code; use `hash(seed)`.
- Aspect ratios: `9:16`, `16:9`, `1:1`. Thai font stack: `"Loma","Noto Sans Thai","Sarabun",sans-serif`.
- Targets: 10 characters, 10 styles.
- `render.cjs` exit codes: 0 ok, 1 invalid story / ffmpeg error, 2 QA failure.

## Review Focus
1. Story with an unknown character/pose/style -> rejected with a readable path (`shots[2].actors.cat.pose[0]`), not a blank frame. Test in Task 1.
2. Keyframe times out of order or beyond shot duration -> rejected. Test in Task 1.
3. A pose drawing outside a character's declared bbox -> crop QA would lie. Test in Task 2 (alpha-bounds check for every character x pose).
4. Long Thai subtitle (>3 lines) on 1:1 -> overflow flagged. Test in Task 4.
5. Parallel render with frames not divisible by worker count -> duration still exact. Test in Task 5.

---

### Task 1: Story schema + validator
**Files:** Create `video-engine/engine/schema.cjs`, `video-engine/test/schema.test.cjs`, `video-engine/package.json`
**Interfaces:**
- Produces: `validateStory(obj) -> { ok: boolean, errors: string[], story }` (errors are `path: message`).
- Consumes: `characters.js` (`CHARACTERS`, `POSES`), `styles.js` (`STYLES`), `props.js` (`PROPS`) - from Tasks 2-3.
- [x] Tests: valid `stories/rabbit-tortoise.json` -> ok; unknown actor `dragon` -> error containing `shots[0].actors.dragon`; pose `fly` -> error; style `neon` -> error; keys `[[2,0],[1,5]]` -> "ascending"; key t > dur -> "beyond shot duration"; empty shots -> error.
- [x] Implement with zod for shape + a semantic pass for references and timing.
- [x] `npm test` passes; commit.

### Task 2: Declarative rig + 10 characters
**Files:** Create `engine/rig.js`, `engine/characters.js`, `test/rig.test.cjs`
**Interfaces:**
- `CHARACTERS[name] = { template: 'critter'|'shell', bbox: [l,t,r,b], colors, features }`
- `POSES = ['idle','walk','hop','run','sleep','shock','happy','sad','talk']`
- `Rig.draw(ctx, name, pose, t, palette)` draws at origin, feet at y=0, facing +x.
- Characters: rabbit, tortoise, cat, dog, fox, bear, pig, mouse, panda, frog.
- Pose = data: body lift `{amp,freq}`, limb swing, ear/tail motion, face `{eyes:'open'|'closed'|'wide', mouth:'smile'|'o'|'frown'|'talk'}`, `layout:'stand'|'lying'`, fx `['zzz'|'speed'|'bang'|'tear']`.
- [x] Test: for every character x pose x t in {0,0.37,1.1}: draw on 600x600 transparent canvas at (300,450); opaque-pixel bounds lie inside bbox (+4px tolerance) and >500 opaque pixels.
- [x] Implement; tests pass; commit.

### Task 3: 10 styles + props + stage refactor
**Files:** Create `engine/styles.js`, `engine/props.js`; Modify `engine/stage.js`, `engine/stage.html`, `stories/rabbit-tortoise.json`
**Interfaces:**
- `STYLES[name] = { palette, sky:'day'|'sunset'|'night', backdrop:'hills'|'mountains'|'dunes'|'sea'|'city'|'forest', particles:null|'snow'|'stars'|'leaves'|'bubbles' }`
- Styles: storybook, sunset, night, winter, desert, beach, forest, city, candy, mono.
- `PROPS = { tree, finish, rock, sign, house }`, each `draw(ctx, p, palette)`; story `props: [{type,x,text?}]` replaces `finishX/treeX`.
- `window.init(cfg) -> total`, `window.draw(t)`, `window.qa(t) -> {cropped:[], subtitle:{lines,box,overflow}}`.
- [x] Rendering demo story in all 10 styles succeeds (covered by Task 4 goldens).

### Task 4: QA module + golden-frame tests
**Files:** Create `engine/qa.cjs`, `test/qa.test.cjs`, `test/golden.test.cjs`, `test/golden/*.png`
**Interfaces:**
- `frameStats(rgbaBuffer, w, h) -> { mean, std }`; `isBlack(stats)` mean < 10; `isFrozen(hashes, fps, maxSec=2.5)`.
- `checkTimeline(voiceReport, durs) -> errors[]` (audioSec > shotSec).
- Subtitle overflow: lines > 3 or box outside frame.
- [x] Tests: synthetic black buffer -> black; noise -> not; 3s of identical hashes at 24fps -> frozen; 30-word Thai subtitle at 1:1 -> overflow; goldens for 10 styles x 3 aspects at one fixed t compare with pixelmatch, <0.5% pixels differ (`UPDATE_GOLDEN=1` rewrites).
- [x] Commit.

### Task 5: Parallel render + integration
**Files:** Modify `engine/render.cjs`; Create `test/render.test.cjs`
**Interfaces:** `--workers N` (default min(4, cpus)); each worker renders contiguous frame range to `build/seg-k.mp4`, then concat demuxer + audio mux. Validates story first (exit 1), runs QA (exit 2).
- [x] Test: 3s story, 24fps, workers=3 and 2 -> ffprobe duration 3.0+-0.05, frame count 72.
- [x] Update README; commit.
