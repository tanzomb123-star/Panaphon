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
    frog:     { template: 'critter', bbox: [-100, -205, 112, 15], colors: { fur: '#6cc35a', belly: '#d8f2b4', inner: '#ff9db0', accent: '#4e9e40', nose: '#3a2b24' }, features: { ears: 'frog', tail: 'none', snout: 'none' } },

    /* ---- people: chibi template 'human'. hair: short|side|long|ponytail|bun|bob; bottom: pants|shorts|skirt|longskirt;
       top: shirt|coat|suit; hat: none|fedora|straw; extras: tie|glasses|stethoscope|cane|magnifier|book|apron|blush ---- */
    narrator:  { template: 'human', label: 'ผู้บรรยาย', bbox: [-98, -235, 95, 15], colors: { skin: '#e8b58e', hair: '#2b2220', top: '#2e3a59', inner: '#ffffff', bottom: '#2b2f3a', shoe: '#3a2b24', accent: '#c0392b' }, features: { hair: 'side', top: 'suit', bottom: 'pants', hat: 'none', extras: ['tie', 'glasses'] } },
    boy:       { template: 'human', label: 'เด็กชาย', bbox: [-82, -205, 80, 12], colors: { skin: '#d9a277', hair: '#1f1a18', top: '#ff8a3d', inner: '#ffffff', bottom: '#3d6fb6', shoe: '#e94f4f', accent: '#ffd23f' }, features: { scale: 0.82, hair: 'short', top: 'shirt', bottom: 'shorts', hat: 'none', extras: ['blush'] } },
    girl:      { template: 'human', label: 'เด็กหญิง', bbox: [-82, -205, 80, 12], colors: { skin: '#f0c7a4', hair: '#2a1f1d', top: '#ff8fb8', inner: '#ffffff', bottom: '#ff8fb8', shoe: '#7a4fd1', accent: '#ffd23f' }, features: { scale: 0.82, hair: 'ponytail', top: 'shirt', bottom: 'skirt', hat: 'none', extras: ['blush'] } },
    dad:       { template: 'human', label: 'พ่อ', bbox: [-98, -235, 95, 15], colors: { skin: '#d49a6e', hair: '#231c1a', top: '#7fb7e6', inner: '#ffffff', bottom: '#5b6270', shoe: '#3a2b24', accent: '#2e3a59' }, features: { hair: 'short', top: 'shirt', bottom: 'pants', hat: 'none', extras: [] } },
    mom:       { template: 'human', label: 'แม่', bbox: [-98, -235, 95, 15], colors: { skin: '#f0c19c', hair: '#3a2420', top: '#ffcf4a', inner: '#ffffff', bottom: '#4fa37a', shoe: '#a0522d', accent: '#e94f4f' }, features: { hair: 'long', top: 'shirt', bottom: 'skirt', hat: 'none', extras: [] } },
    grandma:   { template: 'human', label: 'คุณยาย', bbox: [-98, -242, 103, 15], colors: { skin: '#e2b08b', hair: '#d9d9d9', top: '#b9a3d9', inner: '#ffffff', bottom: '#6a3d7a', shoe: '#5a4636', accent: '#8a5a32' }, features: { hair: 'bun', top: 'shirt', bottom: 'longskirt', hat: 'none', elder: true, extras: ['glasses', 'cane'] } },
    teacher:   { template: 'human', label: 'ครู', bbox: [-98, -235, 95, 15], colors: { skin: '#eab892', hair: '#2b1d1a', top: '#ffffff', inner: '#ffffff', bottom: '#2e3a59', shoe: '#2b2220', accent: '#c0392b' }, features: { hair: 'bob', top: 'shirt', bottom: 'skirt', hat: 'none', extras: ['glasses', 'book'] } },
    doctor:    { template: 'human', label: 'หมอ', bbox: [-98, -235, 95, 15], colors: { skin: '#e0a882', hair: '#1f1a18', top: '#ffffff', inner: '#3fb8af', bottom: '#3fb8af', shoe: '#ffffff', accent: '#7f8c8d' }, features: { hair: 'short', top: 'coat', bottom: 'pants', hat: 'none', extras: ['stethoscope'] } },
    vendor:    { template: 'human', label: 'แม่ค้า', bbox: [-98, -250, 110, 28], colors: { skin: '#c98d62', hair: '#1f1a18', top: '#e94f4f', inner: '#ffffff', bottom: '#2b2220', shoe: '#a0522d', accent: '#4fa37a' }, features: { hair: 'bun', top: 'shirt', bottom: 'pants', hat: 'straw', extras: ['apron'] } },
    detective: { template: 'human', label: 'นักสืบ', bbox: [-98, -255, 115, 20], colors: { skin: '#e3ad86', hair: '#2b2220', top: '#b8935a', inner: '#ffffff', bottom: '#4a3f35', shoe: '#2b2220', accent: '#5a3e2b' }, features: { hair: 'short', top: 'coat', bottom: 'pants', hat: 'fedora', extras: ['magnifier'] } }
,

    /* ---- bean figures: round head, 2-bone limbs (reference-sheet model). body: shirt|dress|stick ---- */
    bean:      { template: 'bean', label: 'บีน', bbox: [-95, -250, 115, 20], colors: { skin: '#f6b24a', shirt: '#f3923d', pants: '#2f8f8a', shoe: '#d0632a' }, features: { body: 'shirt' } },
    beanpink:  { template: 'bean', label: 'บีนชมพู', bbox: [-90, -245, 100, 20], colors: { skin: '#f7c0bb', shirt: '#9fe3c4', pants: '#f7c0bb', shoe: '#e8a0a8' }, features: { body: 'dress', blush: true, scale: 0.86 } },
    stick:     { template: 'bean', label: 'ก้านไม้', bbox: [-95, -250, 115, 20], colors: { skin: '#ffffff', shirt: '#8bc34a', pants: '#222222', shoe: '#8bc34a' }, features: { body: 'stick' } }
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
