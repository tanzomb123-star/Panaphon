/* Pixel / timeline QA. Pure functions so they are unit-testable; render.cjs feeds them sampled frames. */

/** Luminance mean/std of an RGBA buffer (every 4th pixel). */
function frameStats(rgba, w, h) {
  let n = 0, sum = 0, sq = 0;
  for (let i = 0; i < w * h * 4; i += 16) { const l = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]; sum += l; sq += l * l; n++; }
  const mean = sum / n; return { mean, std: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
}
const isBlack = (st) => st.mean < 10;
/** Exact checksum of the frame, so any real change (even a drifting cloud) counts as motion. */
function frameHash(rgba) { let h = 2166136261; for (let i = 0; i < rgba.length; i += 7) { h ^= rgba[i]; h = Math.imul(h, 16777619) >>> 0; } return h; }
/** hashes sampled every `step` seconds. Frozen = identical hash for longer than maxSec. Returns [{ from, to }] in seconds. */
function frozenRuns(hashes, step, maxSec = 2.5) {
  const runs = []; let start = 0;
  for (let i = 1; i <= hashes.length; i++) if (i === hashes.length || hashes[i] !== hashes[start]) { if ((i - start) * step > maxSec) runs.push({ from: +(start * step).toFixed(2), to: +(i * step).toFixed(2) }); start = i; }
  return runs;
}
/** Voiceover must fit its shot. report: voice-report.json rows; durs: final shot durations. */
function checkTimeline(report, durs) {
  return report.flatMap((r, i) => (r.audioSec > durs[i] ? [`${r.shot}: voiceover ${r.audioSec}s longer than shot ${durs[i]}s`] : []))
    .concat(report.filter((r) => r.ok === false).map((r) => `${r.shot}: voiceover does not match script (similarity ${r.similarity})`));
}
module.exports = { frameStats, isBlack, frameHash, frozenRuns, checkTimeline };
