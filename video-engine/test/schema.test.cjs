const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { validateStory } = require('../engine/schema.cjs');
const demo = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../stories/rabbit-tortoise.json'), 'utf8'));
const has = (res, needle) => assert.ok(res.errors.some((e) => e.includes(needle)), `expected error containing "${needle}", got:\n${res.errors.join('\n')}`);

test('demo story is valid', () => { const r = validateStory(demo()); assert.deepStrictEqual(r.errors, []); assert.ok(r.ok); });
test('all stories in stories/ are valid', () => {
  for (const f of fs.readdirSync(path.join(__dirname, '../stories'))) { const r = validateStory(JSON.parse(fs.readFileSync(path.join(__dirname, '../stories', f), 'utf8'))); assert.deepStrictEqual(r.errors, [], f); }
});
test('unknown character is reported with its path', () => { const s = demo(); s.shots[0].actors.dragon = { x: 0 }; has(validateStory(s), 'shots[0].actors.dragon'); });
test('aliased character via "character" field', () => { const s = demo(); s.shots[0].actors.hero = { character: 'cat', x: 0 }; assert.ok(validateStory(s).ok); });
test('unknown pose', () => { const s = demo(); s.shots[1].actors.rabbit.pose = [[0, 'fly']]; has(validateStory(s), 'shots[1].actors.rabbit.pose[0]: unknown pose "fly"'); });
test('unknown style', () => { const s = demo(); s.style = 'neon'; has(validateStory(s), 'unknown style "neon"'); });
test('unknown prop', () => { const s = demo(); s.props.push({ type: 'castle', x: 0 }); has(validateStory(s), 'props[2].type'); });
test('keyframes out of order', () => { const s = demo(); s.shots[2].actors.rabbit.x = [[2, 0], [1, 5]]; has(validateStory(s), 'ascending'); });
test('keyframe beyond shot duration', () => { const s = demo(); s.shots[2].actors.rabbit.x = [[0, 0], [9, 5]]; has(validateStory(s), 'beyond shot duration'); });
test('empty shots rejected', () => { const s = demo(); s.shots = []; assert.ok(!validateStory(s).ok); });
test('wrong types rejected', () => { const s = demo(); s.shots[0].dur = 'four'; has(validateStory(s), 'shots[0].dur'); });
test('duplicate shot ids', () => { const s = demo(); s.shots[1].id = 's1'; has(validateStory(s), 'duplicate id'); });
