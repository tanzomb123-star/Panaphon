#!/usr/bin/env node
/* Story JSON -> MP4. Validate -> QA (crop, subtitle overflow, black/frozen frames, voice timing) -> parallel render -> concat + audio.
   node engine/render.cjs --story stories/rabbit-tortoise.json --aspect 9:16 [--style night] [--short 720] [--fps 24]
        [--workers 4] [--timeline build/timeline.json --audio build/narration.mp3] [--out out/clip.mp4] [--no-qa-fail]
   Exit: 0 ok, 1 invalid story / ffmpeg error, 2 QA failure. */
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const { validateStory } = require('./schema.cjs');
const qa = require('./qa.cjs');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes('--' + k);

function dims(aspect, short) {
  const [aw, ah] = aspect.split(':').map(Number), even = (n) => Math.round(n / 2) * 2;
  return aw >= ah ? { W: even(short * aw / ah), H: even(short) } : { W: even(short), H: even(short * ah / aw) };
}

async function openStage(browser, W, H, cfg) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.join(__dirname, 'stage.html'));
  // same pure QA functions as Node, evaluated next to the pixels to avoid copying whole frames out of the browser
  await page.addScriptTag({ content: `window.QA = { frameStats: ${qa.frameStats}, frameHash: ${qa.frameHash} };` });
  const total = await page.evaluate((c) => window.init(c), cfg);
  return { page, total };
}

/** Geometry + pixel QA sampled every `step` seconds. Returns { errors, report }. */
async function runQA(page, total, W, H, step = 0.25) {
  const errors = [], cropped = [], overflow = new Set(), hashes = [], black = [];
  for (let t = 0; t < total; t += step) {
    const r = await page.evaluate((tt) => window.qa(tt), t);
    if (r.cropped.length) cropped.push({ t: +t.toFixed(2), actors: r.cropped });
    if (r.subtitle && r.subtitle.overflow) overflow.add(`t=${t.toFixed(2)} lines=${r.subtitle.lines}`);
    const px = await page.evaluate(([tt, w, h]) => { window.draw(tt); const d = document.getElementById('c').getContext('2d').getImageData(0, 0, w, h).data; return { st: window.QA.frameStats(d, w, h), hash: window.QA.frameHash(d) }; }, [t, W, H]);
    hashes.push(px.hash);
    if (t > 0.45 && t < total - 0.45 && qa.isBlack(px.st)) black.push(+t.toFixed(2));
  }
  const frozen = qa.frozenRuns(hashes, step);
  if (cropped.length) errors.push(`character out of frame at ${cropped.slice(0, 3).map((c) => c.t + 's ' + c.actors.map((a) => a.id).join('+')).join(', ')}`);
  if (overflow.size) errors.push(`subtitle overflow: ${[...overflow].slice(0, 3).join('; ')}`);
  if (black.length) errors.push(`black frames at ${black.slice(0, 5).join(', ')}s`);
  if (frozen.length) errors.push(`frozen video ${frozen.map((f) => f.from + '-' + f.to + 's').join(', ')}`);
  return { errors, report: { cropped, overflow: [...overflow], black, frozen } };
}

async function renderSegment(browser, cfg, W, H, fps, from, to, file, tick) {
  const { page } = await openStage(browser, W, H, cfg);
  // -c:v mjpeg: tell ffmpeg the pipe holds JPEGs; probing a tiny all-black first frame (fade-in) can fail otherwise
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  let exited = false; const done = new Promise((r) => ff.on('close', (c) => { exited = true; r(c); }));
  ff.stdin.on('error', () => {}); // EPIPE is reported through the exit check below
  for (let f = from; f < to; f++) {
    if (exited) throw new Error('ffmpeg exited early while writing ' + file);
    await page.evaluate((t) => window.draw(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await Promise.race([new Promise((r) => ff.stdin.once('drain', r)), done]);
    if (tick) tick();
  }
  ff.stdin.end(); const code = await done; await page.close(); if (code) throw new Error('ffmpeg segment failed ' + file);
}

async function render(o) {
  const vr = validateStory(o.story); if (!vr.ok) return { code: 1, errors: vr.errors };
  const { W, H } = dims(o.aspect, o.short), fps = o.fps;
  const durs = o.timeline && fs.existsSync(o.timeline) ? JSON.parse(fs.readFileSync(o.timeline, 'utf8')).durs : [];
  const cfg = { W, H, story: o.story, style: o.style, durs };
  // progress: QA 0-10%, frames 10-95%, concat/mux 95-100%; values only ever increase
  let last = 0; const report = (v) => { if (o.onProgress && v > last) { last = v; o.onProgress(+v.toFixed(3)); } };
  const browser = await chromium.launch(); let tmp = null;
  try {
    const { page, total } = await openStage(browser, W, H, cfg);
    const q = o.qa === false ? { errors: [], report: {} } : await runQA(page, total, W, H);
    report(0.1);
    const vrep = path.join(path.dirname(o.timeline || ''), 'voice-report.json');
    if (o.timeline && fs.existsSync(vrep)) q.errors.push(...qa.checkTimeline(JSON.parse(fs.readFileSync(vrep, 'utf8')), durs.length ? durs : o.story.shots.map((s) => s.dur)));
    await page.close();
    if (q.errors.length && o.failOnQA) return { code: 2, errors: q.errors, qa: q.report };
    const frames = Math.round(total * fps), workers = Math.max(1, Math.min(o.workers, frames));
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cve-')); const segs = [];
    const per = Math.ceil(frames / workers), jobs = []; let doneFrames = 0;
    const tick = () => { doneFrames++; if (doneFrames % 6 === 0 || doneFrames === frames) report(0.1 + 0.85 * doneFrames / frames); };
    for (let k = 0; k < workers; k++) { const from = k * per, to = Math.min(frames, from + per); if (from >= to) break; const f = path.join(tmp, `seg-${k}.mp4`); segs.push(f); jobs.push(renderSegment(browser, cfg, W, H, fps, from, to, f, tick)); }
    await Promise.all(jobs);
    fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
    fs.mkdirSync(path.dirname(o.out), { recursive: true });
    const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt')];
    if (o.audio && fs.existsSync(o.audio)) args.push('-i', o.audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k');
    args.push('-c:v', 'copy', '-t', String(frames / fps), o.out);
    execFileSync('ffmpeg', args);
    fs.writeFileSync(o.out.replace(/\.mp4$/, '') + '.qa.json', JSON.stringify({ errors: q.errors, ...q.report }, null, 2));
    report(1);
    return { code: q.errors.length ? 2 : 0, out: o.out, W, H, fps, seconds: frames / fps, frames, workers: segs.length, errors: q.errors };
  } finally { await browser.close(); if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); }
}

module.exports = { render, dims };
if (require.main === module) {
  const storyPath = arg('story', 'stories/rabbit-tortoise.json'), aspect = arg('aspect', '9:16');
  const story = JSON.parse(fs.readFileSync(path.resolve(storyPath), 'utf8'));
  render({
    story, aspect, style: arg('style', story.style), short: +arg('short', 720), fps: +arg('fps', 24),
    workers: +arg('workers', Math.min(4, os.cpus().length)), timeline: arg('timeline'), audio: arg('audio'),
    out: path.resolve(arg('out', `out/${path.basename(storyPath, '.json')}-${aspect.replace(':', 'x')}.mp4`)),
    failOnQA: !flag('no-qa-fail'), qa: !flag('skip-qa')
  }).then((r) => { console.log(JSON.stringify(r)); process.exit(r.code); }).catch((e) => { console.error(e); process.exit(1); });
}
