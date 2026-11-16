/* Story validation: shape (zod) + semantics (references, timing). AI-written stories must pass before rendering.
   validateStory(obj) -> { ok, errors: ["path: message"], story } */
const { z } = require('zod');
const { CHARACTERS, POSES } = require('./characters.js');
const { SCENES } = require('./scenes.js');
const { LOOKS } = require('./looks.js');
const { PROPS } = require('./props.js');

const num = z.number().finite();
const keys = z.array(z.tuple([num, num])).min(1);
const numOrKeys = z.union([num, keys]);
const poseKeys = z.union([z.string(), z.array(z.tuple([num, z.string()])).min(1)]);
const Actor = z.object({ character: z.string().optional(), x: numOrKeys, pose: poseKeys.optional(), facing: z.union([z.literal(1), z.literal(-1)]).optional() }).strict();
const Shot = z.object({
  id: z.string().min(1), dur: num.positive().max(60), text: z.string().max(300).optional(), title: z.string().max(60).optional(),
  cam: z.array(z.tuple([num, num, num, num.positive(), num.positive()])).min(1),
  actors: z.record(Actor)
}).strict();
const Story = z.object({
  title: z.string().min(1), style: z.string().optional(), scene: z.string().optional(), track: z.boolean().optional(),
  props: z.array(z.object({ type: z.string(), x: num, text: z.string().max(30).optional() }).strict()).optional(),
  shots: z.array(Shot).min(1).max(40)
}).strict();

const fmt = (path) => path.reduce((s, p) => (typeof p === 'number' ? `${s}[${p}]` : s ? `${s}.${p}` : p), '');

function checkTimes(list, dur, path, errors) {
  if (!Array.isArray(list)) return;
  for (let i = 1; i < list.length; i++) if (list[i][0] < list[i - 1][0]) errors.push(`${path}[${i}]: keyframe times must be ascending`);
  for (let i = 0; i < list.length; i++) if (list[i][0] < 0 || list[i][0] > dur) errors.push(`${path}[${i}]: time ${list[i][0]} is beyond shot duration ${dur}`);
}

function validateStory(obj) {
  const r = Story.safeParse(obj);
  if (!r.success) return { ok: false, errors: r.error.issues.map((i) => `${fmt(i.path)}: ${i.message}`), story: null };
  const s = r.data, errors = [];
  if (s.style && !LOOKS[s.style]) errors.push(`style: unknown style "${s.style}" (known: ${Object.keys(LOOKS).join(', ')})`);
  if (s.scene && !SCENES[s.scene]) errors.push(`scene: unknown scene "${s.scene}" (known: ${Object.keys(SCENES).join(', ')})`);
  (s.props || []).forEach((p, i) => { if (!PROPS[p.type]) errors.push(`props[${i}].type: unknown prop "${p.type}"`); });
  const ids = new Set();
  s.shots.forEach((sh, si) => {
    const base = `shots[${si}]`;
    if (ids.has(sh.id)) errors.push(`${base}.id: duplicate id "${sh.id}"`); ids.add(sh.id);
    checkTimes(sh.cam, sh.dur, `${base}.cam`, errors);
    for (const [id, a] of Object.entries(sh.actors)) {
      const ap = `${base}.actors.${id}`, ch = a.character || id;
      if (!CHARACTERS[ch]) errors.push(`${ap}: unknown character "${ch}"`);
      if (Array.isArray(a.x)) checkTimes(a.x, sh.dur, `${ap}.x`, errors);
      if (Array.isArray(a.pose)) { checkTimes(a.pose, sh.dur, `${ap}.pose`, errors); a.pose.forEach(([, p], i) => { if (!POSES.includes(p)) errors.push(`${ap}.pose[${i}]: unknown pose "${p}"`); }); }
      else if (typeof a.pose === 'string' && !POSES.includes(a.pose)) errors.push(`${ap}.pose: unknown pose "${a.pose}"`);
    }
  });
  return { ok: errors.length === 0, errors, story: s };
}

module.exports = { validateStory };
if (require.main === module) {
  const f = process.argv[2]; const res = validateStory(JSON.parse(require('fs').readFileSync(f, 'utf8')));
  console.log(res.ok ? 'OK ' + f : res.errors.join('\n')); process.exit(res.ok ? 0 : 1);
}
