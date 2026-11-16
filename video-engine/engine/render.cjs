#!/usr/bin/env node
/* Render a story JSON to MP4: headless Chromium draws each frame from time t, ffmpeg encodes.
   node engine/render.cjs --story stories/rabbit-tortoise.json --aspect 9:16 --style storybook --out out/clip.mp4
   Optional: --timeline build/timeline.json (shot durations from voiceover) --audio build/narration.mp3 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const root = path.resolve(__dirname, '..');
const story = JSON.parse(fs.readFileSync(path.resolve(arg('story', 'stories/rabbit-tortoise.json')), 'utf8'));
const aspect = arg('aspect', '9:16'), short = +arg('short', 720), fps = +arg('fps', 24), style = arg('style', story.style || 'storybook');
const out = path.resolve(arg('out', `out/clip-${aspect.replace(':', 'x')}.mp4`));
const audio = arg('audio'), tl = arg('timeline');
const [aw, ah] = aspect.split(':').map(Number); const even = (n) => Math.round(n / 2) * 2;
const W = aw >= ah ? even(short * aw / ah) : even(short), H = aw >= ah ? even(short) : even(short * ah / aw);
const durs = tl && fs.existsSync(tl) ? JSON.parse(fs.readFileSync(tl, 'utf8')).durs : [];

(async () => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.join(__dirname, 'stage.html'));
  const total = await page.evaluate((cfg) => window.init(cfg), { W, H, story, style, durs });
  const frames = Math.round(total * fps);
  // QA 1: no character may be cropped/out of frame in any aspect ratio
  const cropped = [];
  for (let f = 0; f < frames; f += Math.max(1, Math.round(fps / 4))) { const bad = await page.evaluate((t) => window.qa(t), f / fps); if (bad.length) cropped.push({ t: +(f / fps).toFixed(2), bad }); }
  if (cropped.length) { console.error('QA FAIL: cropped characters', JSON.stringify(cropped.slice(0, 5))); }
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio && fs.existsSync(audio)) args.push('-i', audio);
  args.push('-t', String(total), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-r', String(fps));
  if (audio && fs.existsSync(audio)) args.push('-c:a', 'aac', '-b:a', '160k');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.draw(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); const code = await done; await browser.close();
  console.log(JSON.stringify({ out, W, H, fps, seconds: total, frames, cropped: cropped.length, ffmpeg: code }));
  process.exit(code || (cropped.length ? 2 : 0));
})();
