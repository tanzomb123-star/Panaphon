#!/usr/bin/env node
/* Thai voiceover: per-shot TTS (ElevenLabs) -> measure duration -> timeline.json -> narration.mp3
   -> speech-to-text round trip, similarity score per shot (the "listen back and check" step).
   node engine/voice.cjs --story stories/rabbit-tortoise.json [--voice EXAVITQu4vr4xnSDxMaL] [--model eleven_v3]
   Auth: key is injected by the network proxy, or set ELEVENLABS_API_KEY for local use. */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const story = JSON.parse(fs.readFileSync(path.resolve(arg('story', 'stories/rabbit-tortoise.json')), 'utf8'));
const voice = arg('voice', 'EXAVITQu4vr4xnSDxMaL'), model = arg('model', 'eleven_multilingual_v2'), pad = +arg('pad', 0.5), minSim = +arg('minsim', 0.75);
const build = path.resolve('build'); fs.mkdirSync(path.join(build, 'audio'), { recursive: true });
const hdr = process.env.ELEVENLABS_API_KEY ? ['-H', 'xi-api-key: ' + process.env.ELEVENLABS_API_KEY] : [];
const curl = (...a) => execFileSync('curl', ['-sS', ...hdr, ...a], { maxBuffer: 1 << 28 });
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const norm = (s) => s.replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
function sim(a, b) { a = [...norm(a)]; b = [...norm(b)]; if (!a.length || !b.length) return 0; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return 1 - d[a.length][b.length] / Math.max(a.length, b.length); }

const report = []; const durs = []; const files = [];
story.shots.forEach((sh, i) => {
  const f = path.join(build, 'audio', `${sh.id}.mp3`); const body = { text: sh.text, model_id: model };
  if (model === 'eleven_v3') body.language_code = 'th';
  curl('-X', 'POST', `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, '-H', 'content-type: application/json', '-d', JSON.stringify(body), '-o', f);
  if (fs.readFileSync(f).slice(0, 1)[0] === 0x7b) { console.error('TTS error:', fs.readFileSync(f, 'utf8').slice(0, 300)); process.exit(1); }
  const d = dur(f); durs.push(Math.max(sh.dur, +(d + pad).toFixed(2))); files.push({ f, d });
  let heard = null, score = null;
  try { const r = JSON.parse(curl('-X', 'POST', 'https://api.elevenlabs.io/v1/speech-to-text', '-F', 'model_id=scribe_v1', '-F', 'language_code=tha', '-F', 'file=@' + f).toString());
    if (r.text !== undefined) { heard = r.text; score = +sim(sh.text, heard).toFixed(3); } else heard = 'STT unavailable: ' + (r.detail && r.detail.status); } catch (e) { heard = 'STT failed'; }
  report.push({ shot: sh.id, audioSec: +d.toFixed(2), shotSec: durs[i], expected: sh.text, heard, similarity: score, ok: score === null ? null : score >= minSim });
  console.log(JSON.stringify(report[report.length - 1]));
});
// assemble narration aligned to shot starts
let t = 0; const inputs = [], filt = [];
files.forEach((x, i) => { inputs.push('-i', x.f); filt.push(`[${i}:a]adelay=${Math.round(t * 1000)}:all=1[a${i}]`); t += durs[i]; });
const mix = files.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${files.length}:normalize=0,apad=whole_dur=${t.toFixed(2)}[m]`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filt.join(';') + ';' + mix, '-map', '[m]', '-t', t.toFixed(2), path.join(build, 'narration.mp3')]);
fs.writeFileSync(path.join(build, 'timeline.json'), JSON.stringify({ voice, model, durs }, null, 2));
fs.writeFileSync(path.join(build, 'voice-report.json'), JSON.stringify(report, null, 2));
const fail = report.filter((r) => r.ok === false).length, unver = report.filter((r) => r.ok === null).length;
console.log(`narration.mp3 ${t.toFixed(1)}s | failed=${fail} unverified=${unver}`); process.exit(fail ? 3 : 0);
