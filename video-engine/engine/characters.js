/* Character library: pure data. A character = template + colors + features (+ bbox for crop QA).
   Add a character by adding an entry here; no drawing code needed. */
(function (root) {
  const CHARACTERS = {
    rabbit:   { template: 'critter', bbox: [-100, -255, 112, 15], colors: { fur: '#f6f0ea', belly: '#ffffff', inner: '#ffb3c1', accent: '#f6f0ea', nose: '#ff8aa5' }, features: { ears: 'long', tail: 'puff', snout: 'none' } },
    tortoise: { template: 'shell',   bbox: [-95, -135, 140, 15], colors: { skin: '#9ccc65', shell: '#4f9a4a', shellLine: '#2f6b2d', blush: '#ff9db0' }, features: {} },
    cat:      { template: 'critter', bbox: [-110, -215, 112, 15], colors: { fur: '#f5a35c', belly: '#ffe3c4', inner: '#ffb3c1', accent: '#d9782f', nose: '#ff7f96' }, features: { ears: 'pointy', tail: 'long', snout: 'none', whiskers: true, stripes: true } },
    dog:      { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#d9b38c', belly: '#fff3e3', inner: '#a7774f', accent: '#8b5e3c', nose: '#3a2b24' }, features: { ears: 'floppy', tail: 'stub', snout: 'muzzle' } },
    fox:      { template: 'critter', bbox: [-115, -215, 118, 15], colors: { fur: '#f07a2b', belly: '#fff6ec', inner: '#3a2b24', accent: '#3a2b24', nose: '#3a2b24' }, features: { ears: 'pointy', tail: 'bushy', snout: 'pointed' } },
    bear:     { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#8d5a3b', belly: '#d8b08c', inner: '#d8b08c', accent: '#8d5a3b', nose: '#3a2b24' }, features: { ears: 'round', tail: 'stub', snout: 'muzzle' } },
    pig:      { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#ffb6c8', belly: '#ffd3df', inner: '#ff8fae', accent: '#ffb6c8', nose: '#ff8fae' }, features: { ears: 'pig', tail: 'curl', snout: 'pig' } },
    mouse:    { template: 'critter', bbox: [-110, -215, 112, 15], colors: { fur: '#b7b7c2', belly: '#ececf2', inner: '#ffb3c1', accent: '#b7b7c2', nose: '#ff8aa5' }, features: { ears: 'big', tail: 'long', snout: 'none', whiskers: true } },
    panda:    { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#fbfbfb', belly: '#ffffff', inner: '#2b2b2b', accent: '#2b2b2b', nose: '#2b2b2b' }, features: { ears: 'round', tail: 'stub', snout: 'muzzle', patches: true, darkLegs: true } },
    frog:     { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#6cc35a', belly: '#d8f2b4', inner: '#ff9db0', accent: '#4e9e40', nose: '#3a2b24' }, features: { ears: 'frog', tail: 'none', snout: 'none' } }
  };
  /* Poses are data too: body lift, limb swing, ear lean, face and effects. */
  const POSE_DEFS = {
    idle:  { lift: null, swing: null, earLean: 0, face: { eyes: 'open', mouth: 'smile' }, fx: [] },
    walk:  { lift: { amp: 5, freq: 5 }, swing: { amp: 12, freq: 5 }, earLean: 0, face: { eyes: 'open', mouth: 'smile' }, fx: [] },
    hop:   { lift: { amp: 55, freq: 5 }, swing: { amp: 10, freq: 5 }, earLean: -0.1, face: { eyes: 'open', mouth: 'smile' }, fx: [] },
    run:   { lift: { amp: 36, freq: 9 }, swing: { amp: 26, freq: 9 }, earLean: -0.5, face: { eyes: 'open', mouth: 'smile' }, fx: ['speed'] },
    sleep: { layout: 'lying', earLean: 0, face: { eyes: 'closed', mouth: 'none' }, fx: ['zzz'] },
    shock: { lift: { amp: 4, freq: 20 }, earLean: 0, face: { eyes: 'wide', mouth: 'o' }, fx: ['bang'] },
    happy: { lift: { amp: 14, freq: 6 }, swing: { amp: 6, freq: 6 }, earLean: 0, face: { eyes: 'happy', mouth: 'grin' }, fx: [] },
    sad:   { lift: null, earLean: 0.6, headDrop: 8, face: { eyes: 'open', mouth: 'frown' }, fx: ['tear'] },
    talk:  { lift: { amp: 2, freq: 4 }, earLean: 0, face: { eyes: 'open', mouth: 'talk' }, fx: [] }
  };
  const POSES = Object.keys(POSE_DEFS);
  const lib = { CHARACTERS, POSE_DEFS, POSES };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib; else root.CharLib = lib;
})(this);
