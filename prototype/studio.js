/* Panaphon Studio page logic. Engine globals: CharLib, LookLib, Rig, SceneLib, PropLib, window.init/draw. */
(function () {
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const CH = CharLib.CHARACTERS, POSES = CharLib.POSES, LOOKS = LookLib.LOOKS, SCENES = SceneLib.SCENES;
  const ANIMAL_TH = { rabbit: 'กระต่าย', tortoise: 'เต่า', cat: 'แมว', dog: 'หมา', fox: 'จิ้งจอก', bear: 'หมี', pig: 'หมู', mouse: 'หนู', panda: 'แพนด้า', frog: 'กบ' };
  const SCENE_TH = { meadow: 'ทุ่งหญ้า', sunset: 'พระอาทิตย์ตก', night: 'กลางคืน', winter: 'หิมะ', desert: 'ทะเลทราย', beach: 'ชายหาด', forest: 'ป่า', city: 'เมือง' };
  const nameOf = (id) => (CH[id] ? CH[id].label || ANIMAL_TH[id] || id : id);
  const sceneLabel = (id) => SCENE_TH[id] || (SCENES[id] && SCENES[id].label) || id;
  const charIdOf = (name) => (CH[name] ? name : Object.keys(CH).find((id) => nameOf(id) === name));
  const ASPECTS = { '9:16': { size: [360, 640], th: 'แนวตั้ง', use: 'TikTok, Reels, Shorts' }, '16:9': { size: [640, 360], th: 'แนวนอน', use: 'YouTube, Facebook' }, '1:1': { size: [480, 480], th: 'จัตุรัส', use: 'โพสต์ฟีด' } };
  const SAMPLES = [{ id: 'people', file: 'stories/people.json', label: 'ตลาดเช้า' }, { id: 'rabbit', file: 'stories/rabbit-tortoise.json', label: 'กระต่ายกับเต่า' }, { id: 'showcase', file: 'stories/showcase.json', label: 'เพื่อนในป่า' }];
  const MAX_CAST = 4;
  const POSE_TH = { idle: 'ยืน', walk: 'เดิน', run: 'วิ่ง', hop: 'กระโดด', sleep: 'นอน', shock: 'ตกใจ', happy: 'ดีใจ', sad: 'เศร้า', talk: 'พูด' };
  const POSE_ID = Object.fromEntries(Object.entries(POSE_TH).map(([k, v]) => [v, k]));
  const LENGTHS = [15, 30, 45, 60];

  const THEMES = [
    { id: 'tale', cat: 'story', why: 'คลิปเล่าเรื่องดีๆ ยาว 1 นาทีขึ้นไปได้รับการดันมากขึ้นในปี 2026', label: 'เรื่องเล่า', desc: 'เรื่องชีวิต นิทาน ข้อคิด อบอุ่นชวนติดตาม', look: 'paper', scene: 'meadow', cast: ['narrator', 'boy', 'grandma'], length: 30, tone: 'อบอุ่น ชวนติดตาม',
      examples: ['คุณยายเล่าตำนานต้นไทรหน้าบ้านที่ไม่มีใครกล้าตัด', 'เด็กชายช่วยแมวจรตัวหนึ่ง แล้วชีวิตเปลี่ยนไป', 'ของขวัญชิ้นสุดท้ายจากพ่อ'],
      archetypes: 'ปลายเรื่องก่อน, click-to-unpause, กั๊กคำตอบ, คำถามที่ทุกคนเคยสงสัย',
      rules: 'ตัวละครหลักชัด มีเป้าหมายและอุปสรรค อารมณ์ขึ้นลง จบด้วยข้อคิดหรือหักมุมที่อบอุ่น',
      starter: { title: 'ต้นไทรที่ไม่มีใครกล้าตัด', shots: [
        { role: 'ฮุก', dur: 3, onscreen: 'ห้ามตัดเด็ดขาด', text: 'ต้นไทรต้นนี้… ไม่มีใครกล้าตัดมาห้าสิบปี', actors: [{ id: 'boy', pose: 'shock' }] },
        { role: 'ตั้งปม', dur: 4, onscreen: 'ยายรู้ความลับ', text: 'แต่คุณยายรู้เหตุผล… ที่ไม่เคยเล่าให้ใครฟัง', actors: [{ id: 'grandma', pose: 'talk' }, { id: 'boy', pose: 'idle' }] },
        { role: 'เฉลย', dur: 4, onscreen: 'ปู่ปลูกไว้ให้ยาย', text: 'ต้นไม้นี้… คุณปู่ปลูกไว้ในวันที่ขอยายแต่งงาน', actors: [{ id: 'grandma', pose: 'happy' }, { id: 'boy', pose: 'happy' }] },
        { role: 'CTA', dur: 3, onscreen: 'บ้านคุณมีไหม?', text: 'บ้านคุณมีของที่ห้ามทิ้งไหม เล่าในคอมเมนต์', actors: [{ id: 'narrator', pose: 'talk' }] }] } },
    { id: 'ghost', cat: 'mystery', why: 'เรื่องสยองและเรื่องลึกลับแบบแอนิเมชันเป็นแนวช่องไม่เปิดหน้าที่เติบโต', label: 'เรื่องผี', desc: 'ตำนาน เรื่องหลอน บรรยากาศเย็นยะเยือก', look: 'noir', scene: 'night', cast: ['narrator', 'girl', 'grandma'], length: 45, tone: 'หลอน เย็นยะเยือก จังหวะช้า',
      examples: ['ห้องพักโรงแรมที่ไม่มีเลข 4', 'เสียงเรียกชื่อตอนตีสามในหมู่บ้าน', 'กระจกบานเก่าในบ้านยาย'],
      archetypes: 'ภาพปริศนา, ปลายเรื่องก่อน, กั๊กคำตอบ, click-to-unpause',
      rules: 'บรรยากาศหลอนไต่ระดับช้าๆ ใช้ความเงียบและ "…" บ่อย เปิดด้วยภาพหรือเสียงปริศนา ไม่ใช้ความรุนแรงหรือภาพสยองเกินไป จบด้วยปมที่ยังค้างหรือหักมุมสุดท้าย บอกชัดว่าเป็นเรื่องเล่าหรือตำนาน ห้ามอ้างว่าเป็นเรื่องจริงถ้าตรวจสอบไม่ได้',
      starter: { title: 'กระจกบานเก่าในบ้านยาย', shots: [
        { role: 'ฮุก', dur: 3, onscreen: 'อย่าส่องตอนตีสาม', text: 'ยายห้ามส่องกระจกบานนี้… ตอนตีสาม', actors: [{ id: 'grandma', pose: 'talk' }] },
        { role: 'ตั้งปม', dur: 4, onscreen: 'แต่หนูส่อง', text: 'แต่คืนนั้น… หลานสาวแอบลุกมาส่อง', actors: [{ id: 'girl', pose: 'walk' }] },
        { role: 'หักมุม', dur: 4, onscreen: 'เงาไม่ขยับตาม', text: 'เงาในกระจก… ไม่ขยับตามเธอ', actors: [{ id: 'girl', pose: 'shock' }] },
        { role: 'CTA', dur: 3, onscreen: 'คุณกล้าส่องไหม?', text: 'ถ้าเป็นคุณ… จะกล้าส่องไหม', actors: [{ id: 'narrator', pose: 'talk' }] }] } },
    { id: 'origin', cat: 'learn', why: 'คำถาม "ทำไม" ตรงกับสิ่งที่คนค้นหา คลิปที่ตอบคำถามแบบนี้มีคนดูจนจบมาก', label: 'ประวัติความเป็นมา', desc: 'ที่มาของสิ่งรอบตัว ประเพณี สถานที่', look: 'thai', scene: 'meadow', cast: ['narrator', 'teacher', 'vendor'], length: 45, tone: 'ชวนรู้ น่าเชื่อถือ',
      examples: ['ที่มาของข้าวเหนียวมะม่วง', 'ทำไมคนไทยไหว้แทนการจับมือ', 'ทำไมกรุงเทพฯ มีชื่อเต็มยาวมาก'],
      archetypes: 'คำถามที่ทุกคนเคยสงสัย, ครู, สวนกระแส, ตัวเลขแปลก',
      rules: 'เปิดด้วยคำถามหรือข้อเท็จจริงที่ขัดความเชื่อ แล้วเล่าที่มาตามลำดับเวลา ใส่ปี ชื่อ สถานที่ที่ตรวจสอบได้ แยกข้อเท็จจริงกับตำนานหรือทฤษฎีให้ชัด ปิดด้วยการเชื่อมกับปัจจุบัน',
      starter: { title: 'ทำไมคนไทยไหว้', shots: [
        { role: 'ฮุก', dur: 3, onscreen: 'ไหว้มาจากไหน?', text: 'ทำไมคนไทย… ไหว้แทนการจับมือ', actors: [{ id: 'teacher', pose: 'talk' }] },
        { role: 'ตั้งปม', dur: 4, onscreen: 'มากกว่ามารยาท', text: 'แต่การไหว้… มีความหมายมากกว่ามารยาท', actors: [{ id: 'teacher', pose: 'idle' }, { id: 'vendor', pose: 'happy' }] },
        { role: 'เฉลย', dur: 5, onscreen: 'มือเปล่า = ไม่มีอาวุธ', text: 'มีทฤษฎีว่าการพนมมือ… คือการแสดงว่าไม่ได้ถืออาวุธ', actors: [{ id: 'narrator', pose: 'talk' }] },
        { role: 'CTA', dur: 3, onscreen: 'เซฟไว้เล่าต่อ', text: 'เซฟไว้… เล่าให้เพื่อนต่างชาติฟัง', actors: [{ id: 'teacher', pose: 'happy' }] }] } },
    { id: 'doc', cat: 'learn', why: 'สารคดีสั้นแบบเล่าเรื่องดูยาวได้ และเหมาะกับช่องไม่เปิดหน้า', label: 'สารคดี', desc: 'เรื่องจริง ปริศนา วิทยาศาสตร์ เล่าแบบสารคดี', look: 'watercolor', scene: 'desert', cast: ['narrator', 'detective', 'doctor'], length: 60, tone: 'สุขุม หนักแน่น จังหวะช้า',
      examples: ['เมืองที่คนทั้งเมืองหายไปในคืนเดียว', 'หมอที่ค้นพบยาเพนิซิลลินโดยบังเอิญ', 'ปริศนาเสียงประหลาดใต้ทะเลลึก'],
      archetypes: 'ข้อเท็จจริงช็อก, ภาพปริศนา, ตัวเลขขัดสามัญสำนึก, คำถามที่ทุกคนเคยสงสัย, ปลายเรื่องก่อน',
      rules: 'โครง 6 จุด: ฮุก → ตั้งปม "แต่ไม่มีใครรู้ว่า…" → ย้อนเล่าตามเวลาพร้อมรายละเอียดจริง (ปี ชื่อ ตัวเลข) → หักมุมราว 70% → เฉลยหรือบอกตรงๆ ว่ายังไม่มีใครรู้ → CTA เดียว พากย์ช้าราว 2.2 คำต่อวินาที ห้ามแต่งตัวเลขหรือคำพูดของคนจริง ถ้าไม่แน่ใจให้ตัดทิ้ง',
      starter: { title: 'ราที่ช่วยคนนับล้าน', shots: [
        { role: 'ฮุก', dur: 3, onscreen: 'ราช่วยโลก', text: 'ราบนจานที่ลืมล้าง… ช่วยชีวิตคนนับล้าน', actors: [{ id: 'doctor', pose: 'shock' }] },
        { role: 'ตั้งปม', dur: 4, onscreen: 'ปี 1928', text: 'ปี 1928… หมอคนหนึ่งกลับจากพักร้อน', actors: [{ id: 'doctor', pose: 'walk' }] },
        { role: 'หักมุม', dur: 5, onscreen: 'เชื้อโรคหายไป', text: 'แต่รอบราบนจาน… เชื้อโรคหายไปหมด', actors: [{ id: 'doctor', pose: 'talk' }, { id: 'detective', pose: 'shock' }] },
        { role: 'CTA', dur: 3, onscreen: 'เซฟไว้', text: 'เซฟไว้… ตอนหน้าเล่าว่าทำไมเกือบไม่มีใครเชื่อ', actors: [{ id: 'narrator', pose: 'talk' }] }] } },
    { id: 'cartoon', cat: 'story', why: 'นิทานแอนิเมชันที่มีข้อคิดเป็นแนวที่คนดูนานและรายได้ต่อวิวค่อนข้างดี', label: 'การ์ตูน', desc: 'สัตว์น่ารัก มุกตลก เด็กดูได้ทั้งบ้าน', look: 'comic', scene: 'forest', cast: ['rabbit', 'tortoise', 'fox'], length: 30, tone: 'สนุก สดใส มุกจังหวะเร็ว',
      examples: ['กระต่ายอยากบินได้เหมือนนก', 'หมูน้อยเปิดร้านขนมในป่า', 'หมีขี้เซาตื่นสายในวันสำคัญ'],
      archetypes: 'click-to-unpause, นักมายากล, กั๊กคำตอบ, ปลายเรื่องก่อน',
      rules: 'ตลก สดใส ตัวละครสัตว์มีนิสัยชัด มีมุกที่เข้าใจได้ในวินาทีเดียว เด็กดูได้ ไม่รุนแรง ข้อคิดสั้นๆ ตอนจบ',
      starter: { title: 'กระต่ายอยากบินได้', shots: [
        { role: 'ฮุก', dur: 3, onscreen: 'กระต่ายจะบิน!', text: 'วันนี้กระต่าย… จะบินให้ได้!', actors: [{ id: 'rabbit', pose: 'hop' }] },
        { role: 'เร่ง', dur: 4, onscreen: 'ครั้งที่ 37', text: 'กระโดดครั้งที่สามสิบเจ็ด… ยังไม่ลอยเลย', actors: [{ id: 'rabbit', pose: 'sad' }, { id: 'fox', pose: 'happy' }] },
        { role: 'หักมุม', dur: 4, onscreen: 'เต่ามีไอเดีย', text: 'แต่เต่ามีไอเดีย… ที่ไม่มีใครคาด', actors: [{ id: 'tortoise', pose: 'talk' }, { id: 'rabbit', pose: 'shock' }] },
        { role: 'CTA', dur: 3, onscreen: 'เดาสิไอเดียอะไร', text: 'เดาสิ… เต่าคิดอะไรไว้ พิมพ์ในคอมเมนต์', actors: [{ id: 'tortoise', pose: 'happy' }, { id: 'rabbit', pose: 'happy' }] }] } },
    { id: 'microdrama', cat: 'story', why: 'ละครสั้นเป็นตอนเป็นแนวที่โตแรงที่สุดตอนนี้ Deloitte คาดรายได้ปี 2026 เกิน 7.8 พันล้านดอลลาร์', label: 'ละครสั้นเป็นตอน', desc: 'ดราม่าครอบครัว ความรัก ตอนละนาที จบค้างทุกตอน', look: 'pastel', scene: 'city', cast: ['mom', 'dad', 'girl'], length: 60, tone: 'ดราม่า เข้มข้น ลุ้นตอนต่อ',
      examples: ['ลูกสาวพบว่าพ่อเก็บความลับเรื่องบ้านไว้ 20 ปี', 'แม่ค้าข้างบ้านคือแม่แท้ๆ ที่ตามหามาตลอด', 'จดหมายที่ส่งผิดบ้านเปลี่ยนชีวิตสองครอบครัว'],
      archetypes: 'click-to-unpause, ปลายเรื่องก่อน, กั๊กคำตอบ',
      rules: 'เขียนเป็น "ตอนที่ 1" ของซีรีส์ เปิดกลางเหตุการณ์ขัดแย้ง ตัวละครมีเป้าหมายและความลับ อารมณ์ไต่ขึ้นทุกช็อต จบด้วย cliffhanger ที่ทำให้อยากดูตอนต่อไป CTA คือ "ติดตามตอน 2"' },
    { id: 'pov', cat: 'story', why: 'คลิป POV ที่เล่าจากมุมมองสมมติยังติดอันดับเทรนด์ TikTok', label: 'POV สมมติ', desc: '"POV: คุณคือ..." พาคนดูเข้าไปอยู่ในเหตุการณ์', look: 'minimal', scene: 'city', cast: ['narrator', 'boy', 'teacher'], length: 30, tone: 'สนุก จับใจ เข้าถึงง่าย',
      examples: ['POV: คุณตื่นมาแล้วทุกคนพูดความในใจออกมาดังๆ', 'POV: คุณเป็นนักเรียนคนเดียวที่ทำการบ้านมา', 'POV: คุณได้ยินแมวที่บ้านพูดครั้งแรก'],
      archetypes: 'click-to-unpause, นักมายากล, ปลายเรื่องก่อน',
      rules: 'ช็อตแรกขึ้นตัวหนังสือ "POV: ..." ชัดเจน เล่าด้วยสรรพนาม "คุณ" ทั้งเรื่อง สถานการณ์ต้องเข้าใจได้ในวินาทีเดียวและคนดูรู้สึกว่าเกิดกับตัวเองได้ มีหักมุมหนึ่งครั้ง' },
    { id: 'fable', cat: 'story', why: 'นิทานสั้นที่มีข้อคิดเหมาะกับครอบครัว คนดูซ้ำบ่อยและส่งต่อให้เด็ก', label: 'นิทานสอนใจ', desc: 'นิทานสัตว์แบบอีสป จบด้วยข้อคิดเดียว', look: 'pastel', scene: 'meadow', cast: ['rabbit', 'tortoise', 'bear'], length: 45, tone: 'อบอุ่น นุ่มนวล เหมาะกับเด็ก',
      examples: ['หมีที่ไม่ยอมแบ่งน้ำผึ้งให้เพื่อน', 'กบที่คิดว่าบ่อของตัวเองใหญ่ที่สุดในโลก', 'หนูตัวเล็กช่วยราชสีห์ออกจากตาข่าย'],
      archetypes: 'ปลายเรื่องก่อน, กั๊กคำตอบ, คำถามที่ทุกคนเคยสงสัย',
      rules: 'ตัวละครสัตว์นิสัยชัด ความขัดแย้งเดียว ภาษาง่ายเด็กเข้าใจ จบด้วยข้อคิดประโยคเดียวที่จำง่าย ไม่รุนแรง' },
    { id: 'funny', cat: 'story', why: 'คอนเทนต์ "เรียลๆ" เรื่องจริงในชีวิตที่หัวเราะด้วยกันได้ กำลังมาแรงในไทยปี 2026', label: 'ตลกชีวิตประจำวัน', desc: 'มุกที่ทุกคนเคยเจอ "คนไทยตอน..." ดูแล้วแท็กเพื่อน', look: 'comic', scene: 'city', cast: ['dad', 'mom', 'boy'], length: 15, tone: 'ฮา รู้สึกร่วม จังหวะเร็ว',
      examples: ['แม่ตอนหาของไม่เจอ vs แม่ตอนเราหาของไม่เจอ', 'พ่อตอนบอกว่า "เดี๋ยวพ่อซ่อมเอง"', 'ตอนได้ยินว่าเงินเดือนออกพรุ่งนี้'],
      archetypes: 'click-to-unpause, ตัวเลขแปลก, สวนกระแส',
      rules: 'มุกเดียว เข้าใจได้ใน 1 วินาที เป็นสถานการณ์ที่คนไทยส่วนใหญ่เคยเจอ ใช้คอนทราสต์หรือการเกินจริงแบบน่ารัก จบด้วยพันช์ไลน์ ไม่ล้อปมด้อยหรือเหยียดใคร CTA ชวน "แท็กคนที่เป็นแบบนี้" ห้ามเด็ดขาด ให้ใช้ "คอมเมนต์ว่าบ้านคุณเป็นไหม" แทน' },
    { id: 'mystery', cat: 'mystery', why: 'เรื่องปริศนาที่ยังไขไม่ได้ทำให้คนค้างคำถามและคอมเมนต์ทฤษฎีของตัวเอง', label: 'ปริศนาไขไม่ได้', desc: 'เหตุการณ์จริงที่ยังไม่มีคำตอบ ให้คนดูช่วยเดา', look: 'noir', scene: 'city', cast: ['detective', 'narrator', 'doctor'], length: 60, tone: 'ลึกลับ สุขุม ชวนคิด',
      examples: ['เรือที่ลอยกลับมาโดยไม่มีลูกเรือสักคน', 'สัญญาณจากอวกาศ 72 วินาทีที่ไม่เคยมาอีกเลย', 'เมืองที่นาฬิกาทุกเรือนหยุดพร้อมกัน'],
      archetypes: 'ข้อเท็จจริงช็อก, นักสืบ, ปลายเรื่องก่อน, กั๊กคำตอบ',
      rules: 'ใช้เหตุการณ์ที่มีบันทึกจริงเท่านั้น แยกข้อเท็จจริงกับทฤษฎีชัดเจน ("มีทฤษฎีว่า...") เล่าเบาะแสทีละชิ้น วางทฤษฎีที่น่าเชื่อสุดไว้ท้าย และบอกตรงๆ ว่ายังไม่มีใครรู้คำตอบ CTA คือให้คอมเมนต์ทฤษฎีของตัวเอง' },
    { id: 'belief', cat: 'mystery', why: 'เรื่องความเชื่อและเคล็ดลับแบบไทยเป็นเรื่องที่คนไทยคุยและส่งต่อกันมาก', label: 'ความเชื่อไทย', desc: 'มูเตลู เคล็ดลับโบราณ ข้อห้ามที่ยายเคยบอก', look: 'thai', scene: 'night', cast: ['grandma', 'vendor', 'girl'], length: 30, tone: 'ลึกลับ อบอุ่นแบบบ้านๆ',
      examples: ['ทำไมยายห้ามตัดเล็บตอนกลางคืน', 'ความเชื่อเรื่องแมวดำเดินผ่านหน้า', 'ทำไมคนโบราณห้ามนอนหันหัวไปทางทิศตะวันตก'],
      archetypes: 'คำถามที่ทุกคนเคยสงสัย, ครู, สวนกระแส',
      rules: 'นำเสนอในฐานะความเชื่อหรือคติชาวบ้าน ห้ามรับประกันผลเรื่องโชคลาภ ห้ามชวนซื้อของขลัง ถ้ามีคำอธิบายทางวิทยาศาสตร์หรือเหตุผลในชีวิตจริงให้เล่าด้วย ปิดด้วยคำถามให้คนเล่าความเชื่อบ้านตัวเอง' },
    { id: 'explainer', cat: 'learn', why: 'คลิปอธิบายที่ตอบคำถามที่คนค้นหาได้ดูจนจบสูง และ Google เริ่มแสดงคลิปสั้นในผลค้นหา', label: 'อธิบายใน 1 นาที', desc: 'ความรู้รอบตัว "ทำไม..." "เกิดอะไรขึ้นเมื่อ..."', look: 'minimal', scene: 'meadow', cast: ['teacher', 'boy', 'girl'], length: 45, tone: 'ชัด กระชับ ฉลาดแบบเป็นกันเอง',
      examples: ['ทำไมท้องฟ้าตอนเย็นเป็นสีส้ม', 'ทำไมเรามักง่วงหลังกินข้าวเที่ยง', 'ทำไมตัวเลขบนแป้นโทรศัพท์กับเครื่องคิดเลขสลับกัน'],
      archetypes: 'คำถามที่ทุกคนเคยสงสัย, ครู, สวนกระแส',
      rules: 'ตอบคำถามเดียวให้จบ เปิดด้วยคำถามที่คนพิมพ์ค้นจริง ให้คำตอบสั้นภายใน 10 วินาทีแรกแล้วค่อยขยายเหตุผล ใช้การเปรียบเทียบกับของใกล้ตัว ข้อเท็จจริงต้องตรวจสอบได้ CTA "เซฟไว้"' },
    { id: 'whatif', cat: 'learn', why: 'สถานการณ์ "ถ้า..." ทำให้คนอยากรู้คำตอบและถกเถียงในคอมเมนต์', label: 'ถ้าเกิด...จะเป็นยังไง', desc: 'วิทยาศาสตร์สนุก สมมติสถานการณ์แปลกๆ', look: 'chalk', scene: 'night', cast: ['teacher', 'doctor', 'boy'], length: 45, tone: 'ตื่นเต้น อยากรู้ อิงวิทยาศาสตร์',
      examples: ['ถ้าโลกหยุดหมุน 1 วินาทีจะเกิดอะไรขึ้น', 'ถ้ามนุษย์ไม่ต้องนอนเลย', 'ถ้าดวงจันทร์หายไปคืนนี้'],
      archetypes: 'คำถามที่ทุกคนเคยสงสัย, หมอดู, ตัวเลขแปลก',
      rules: 'เล่าผลที่ตามมาเป็นลำดับเวลา (1 วินาที 1 วัน 1 ปี) ทุกขั้นอิงหลักวิทยาศาสตร์ที่ยอมรับ บอกชัดเมื่อเป็นการคาดการณ์ เก็บผลที่ช็อกที่สุดไว้ท้าย' },
    { id: 'history', cat: 'learn', why: 'ประวัติศาสตร์เล่าแบบเรื่องสั้นเป็นแนวช่องไม่เปิดหน้าที่ดูได้ตลอด ไม่ตกยุค', label: 'ประวัติศาสตร์', desc: 'เหตุการณ์สำคัญของไทยและโลก เล่าเหมือนหนัง', look: 'paper', scene: 'sunset', cast: ['narrator', 'detective', 'grandma'], length: 60, tone: 'ยิ่งใหญ่ น่าติดตาม น่าเชื่อถือ',
      examples: ['คืนเดียวที่เปลี่ยนชะตากรุงศรีอยุธยา', 'จดหมายที่มาถึงช้าไป 1 วันจนแพ้สงคราม', 'ทำไมสยามไม่เคยเป็นอาณานิคม'],
      archetypes: 'ปลายเรื่องก่อน, ข้อเท็จจริงช็อก, สวนกระแส',
      rules: 'เปิดด้วยช่วงพีคของเหตุการณ์ก่อน แล้วย้อนเล่า ใส่ปี ชื่อ สถานที่ที่ตรวจสอบได้ แยกหลักฐานกับการตีความ ไม่วาดหน้าบุคคลจริงให้ชัด เลี่ยงประเด็นที่อาจละเมิดกฎหมายหรือความอ่อนไหวทางการเมือง' },
    { id: 'psych', cat: 'learn', why: 'จิตวิทยาและการพัฒนาตัวเองแบบแอนิเมชันคนแชร์ต่อและเซฟไว้ดูซ้ำ', label: 'จิตวิทยาน่ารู้', desc: 'พฤติกรรมคน เทคนิคใจ ทำไมเราถึงทำแบบนั้น', look: 'watercolor', scene: 'sunset', cast: ['narrator', 'girl', 'dad'], length: 45, tone: 'นุ่มนวล เข้าใจ ไม่ตัดสิน',
      examples: ['ทำไมเราจำคำติได้นานกว่าคำชม', 'กฎ 2 นาทีที่ทำให้เลิกผัดวันประกันพรุ่ง', 'ทำไมยิ่งมีตัวเลือกเยอะยิ่งเลือกไม่ได้'],
      archetypes: 'ครู, สวนกระแส, คำถามที่ทุกคนเคยสงสัย',
      rules: 'อธิบายแนวคิดเดียวพร้อมตัวอย่างในชีวิตจริง อ้างงานวิจัยเฉพาะที่มีจริง (ถ้าไม่แน่ใจให้พูดกว้างๆ) ให้วิธีใช้ได้ทันทีหนึ่งข้อ ไม่วินิจฉัยโรคทางใจ' },
    { id: 'health', cat: 'learn', why: 'ความรู้สุขภาพใกล้ตัวมีคนค้นหาตลอด แต่ต้องระวังข้อมูลผิด', label: 'สุขภาพใกล้ตัว', desc: 'ร่างกายเราทำงานยังไง ความเชื่อผิดๆ ที่ควรรู้', look: 'minimal', scene: 'city', cast: ['doctor', 'dad', 'grandma'], length: 45, tone: 'เป็นมิตร ชัดเจน น่าเชื่อถือ',
      examples: ['ดื่มน้ำวันละ 8 แก้วจริงหรือ', 'ทำไมเวลาหิวถึงอารมณ์เสียง่าย', 'นั่งนานๆ ส่งผลต่อร่างกายยังไง'],
      archetypes: 'สวนกระแส, คำถามที่ทุกคนเคยสงสัย, ครู',
      rules: 'ใช้ข้อมูลจากหน่วยงานสาธารณสุขหรืองานวิจัยที่ยอมรับเท่านั้น ห้ามรับประกันการรักษา ห้ามแนะนำยาหรืออาหารเสริม จบด้วยคำแนะนำให้ปรึกษาแพทย์เมื่อมีอาการ' },
    { id: 'money', cat: 'life', why: 'การเงินส่วนตัวเป็นหมวดที่โตเร็วในเทรนด์ TikTok กลางปี 2026 และรายได้ต่อวิวสูง', label: 'การเงินใกล้ตัว', desc: 'ออมเงิน ใช้เงิน กับดักหนี้ เล่าเป็นเรื่อง', look: 'minimal', scene: 'city', cast: ['dad', 'mom', 'vendor'], length: 45, tone: 'จริงใจ เข้าใจง่าย ไม่ขายฝัน',
      examples: ['ทำไมเงินเดือนขึ้นแต่เงินเก็บไม่เพิ่ม', 'กาแฟวันละแก้ว 10 ปีเท่ากับเท่าไหร่', 'ผ่อน 0% ฟรีจริงหรือ'],
      archetypes: 'ตัวเลขแปลก, สวนกระแส, ครู, นักทดลอง',
      rules: 'คำนวณตัวเลขให้ถูกและแสดงวิธีคิด ห้ามแนะนำให้ซื้อหุ้นหรือสินทรัพย์ตัวใดตัวหนึ่ง ห้ามรับประกันผลตอบแทน บอกว่าเป็นความรู้ทั่วไปไม่ใช่คำแนะนำการลงทุน' },
    { id: 'founder', cat: 'life', why: 'เรื่องเส้นทางผู้ก่อตั้งเติบโต 210% ใน 30 วันตามข้อมูลกลางปี 2026 (ตัวเลขจากผู้ให้บริการเครื่องมือ)', label: 'เส้นทางธุรกิจ', desc: 'จากศูนย์สู่ร้านดัง ล้มแล้วลุก เล่าแบบเรื่องจริง', look: 'pixel', scene: 'city', cast: ['vendor', 'narrator', 'dad'], length: 60, tone: 'สู้ชีวิต สร้างแรงบันดาลใจ จริงใจ',
      examples: ['แม่ค้าข้าวมันไก่ที่ขายวันแรกได้ 3 จาน', 'ร้านที่เกือบเจ๊งแต่รอดเพราะลูกค้าคนเดียว', 'จากแผงลอยสู่แฟรนไชส์ 200 สาขา'],
      archetypes: 'ปลายเรื่องก่อน, ตัวเลขแปลก, นักทดลอง',
      rules: 'โครง: จุดเริ่มต้นที่ยาก → ความล้มเหลวที่เจ็บที่สุด → การตัดสินใจที่เปลี่ยนเกม → ผลลัพธ์ที่วัดได้ → บทเรียนหนึ่งข้อ ถ้าเป็นธุรกิจจริงต้องใช้ข้อมูลที่ตรวจสอบได้ ถ้าแต่งให้บอกว่าเป็นเรื่องสมมติ' },
    { id: 'book', cat: 'life', why: 'สรุปหนังสือแบบแอนิเมชันมีคนค้นชื่อหนังสือตลอด เป็นคอนเทนต์ที่ไม่ตกยุค', label: 'สรุปหนังสือ', desc: 'แก่นหนังสือดังใน 1 นาที พร้อมไอเดียที่ใช้ได้จริง', look: 'paper', scene: 'meadow', cast: ['narrator', 'teacher', 'boy'], length: 60, tone: 'ฉลาด กระชับ เป็นกันเอง',
      examples: ['สรุป Atomic Habits ใน 60 วินาที', 'ไอเดียเดียวจาก Rich Dad Poor Dad ที่ควรรู้', 'สรุป The Psychology of Money 3 ข้อ'],
      archetypes: 'ครู, ตัวเลขแปลก, กั๊กคำตอบ',
      rules: 'บอกชื่อหนังสือและผู้เขียนให้ถูก สรุปด้วยคำของตัวเอง ห้ามคัดลอกข้อความยาว เลือก 1-3 ไอเดียหลักพร้อมตัวอย่างใช้จริง ปิดด้วยไอเดียที่ทำได้ทันที' },
    { id: 'lifelesson', cat: 'life', why: 'เรื่องจุดเริ่มต้นถึงความสำเร็จสร้างความรู้สึกร่วมและคนจดจำได้', label: 'ข้อคิดชีวิต', desc: 'เรื่องสั้นแรงบันดาลใจ สู้ชีวิต ครอบครัว', look: 'watercolor', scene: 'sunset', cast: ['dad', 'boy', 'grandma'], length: 45, tone: 'ซึ้ง อบอุ่น ให้กำลังใจ',
      examples: ['พ่อที่ขี่มอเตอร์ไซค์ส่งลูกเรียนทุกวัน 12 ปี', 'คำพูดประโยคเดียวของยายที่เปลี่ยนชีวิตหลาน', 'วันที่สอบตกคือวันที่ดีที่สุด'],
      archetypes: 'ปลายเรื่องก่อน, click-to-unpause, กั๊กคำตอบ',
      rules: 'มีช่วงเวลาที่จับใจหนึ่งจุด แสดงด้วยการกระทำมากกว่าคำสอน ข้อคิดสุดท้ายสั้นและไม่เทศนา หลีกเลี่ยงการเร้าอารมณ์เกินจริง' },
    { id: 'food', cat: 'life', why: 'เรื่องอาหารและร้านดังเป็นสิ่งที่คนไทยหยุดดูและแชร์บ่อย', label: 'อาหาร & สตรีทฟู้ด', desc: 'ที่มาของเมนูดัง เคล็ดลับร้านเก่าแก่', look: 'pastel', scene: 'city', cast: ['vendor', 'mom', 'boy'], length: 30, tone: 'หิว อบอุ่น ชวนลอง',
      examples: ['ทำไมผัดไทยถึงชื่อผัดไทย', 'ร้านก๋วยเตี๋ยวที่ขายมา 60 ปีโดยไม่ขึ้นราคา', 'ทำไมข้าวมันไก่ต้องกินกับซุป'],
      archetypes: 'คำถามที่ทุกคนเคยสงสัย, ปลายเรื่องก่อน, กั๊กคำตอบ',
      rules: 'ประวัติเมนูต้องตรวจสอบได้ ถ้าเป็นตำนานให้บอกว่าเป็นตำนาน ใส่รายละเอียดที่ทำให้หิว (เสียง สี กลิ่น) ปิดด้วยคำถามชวนคุยว่าร้านไหนอร่อยสุด' }
  ];
  const CATS = [{ id: 'all', label: 'ทั้งหมด' }, { id: 'story', label: 'เล่าเรื่อง & บันเทิง' }, { id: 'mystery', label: 'ลึกลับ & หลอน' }, { id: 'learn', label: 'ความรู้' }, { id: 'life', label: 'ชีวิต เงิน & ธุรกิจ' }];
  const state = { theme: 'tale', cat: 'all', length: 30, hooks: [], hook: -1, scriptAuto: true, prevScript: null, cast: [], scene: 'meadow', look: 'pastel', aspect: '9:16', storyId: 'mine', stories: {}, t: 0, playing: true, total: 1, images: {}, custom: { chars: [], scenes: [] }, audio: null, audioSynced: false, recording: false };
  const themeOf = () => THEMES.find((t) => t.id === state.theme);

  /* ================= story building: AI/text gives words + who/pose; the page owns positions and camera ================= */
  const SPACING = 230;
  function layoutShot(shot, i) {
    const ids = shot.actors.map((a) => a.id).filter((id) => CH[id]).slice(0, MAX_CAST);
    const n = Math.max(1, ids.length), dur = Math.min(30, Math.max(0.5, +shot.dur || 4)), actors = {};
    ids.forEach((id, k) => {
      const a = shot.actors.find((x) => x.id === id), pose = POSES.includes(a.pose) ? a.pose : 'idle';
      const x = (k - (n - 1) / 2) * SPACING, moving = pose === 'walk' || pose === 'run';
      actors[id] = { x: moving ? [[0, x - 70], [dur, x + 70]] : x, pose, ...(k >= n / 2 && !moving && n > 1 ? { facing: -1 } : {}) };
    });
    const w = Math.max(780, (n - 1) * SPACING + 520);
    return { id: 's' + (i + 1), dur, ...(shot.title ? { title: String(shot.title).slice(0, 40) } : {}), text: String(shot.text || '').slice(0, 160), cam: [[0, 15, -110, w, Math.max(520, w * 0.55)]], actors };
  }
  const buildStory = (title, shots) => ({ title: String(title || 'คลิปของฉัน').slice(0, 60), track: false, scene: state.scene, style: state.look, shots: shots.map(layoutShot) });

  /* ================= script text <-> model ================= */
  const fmtDur = (d) => String(Math.round(d * 100) / 100);
  function serialize(m) {
    const out = [`ชื่อเรื่อง: ${m.title || 'คลิปของฉัน'}`];
    m.shots.forEach((sh, i) => {
      out.push('---', `[${i + 1}] ${sh.role || 'ช็อต'} · ${fmtDur(+sh.dur || 4)} วิ`);
      out.push('ตัวละคร: ' + (sh.actors || []).map((a) => `${nameOf(a.id)}=${POSE_TH[a.pose] || 'ยืน'}`).join(', '));
      out.push('บรรยาย: ' + (sh.text || ''));
      if (sh.onscreen) out.push('บนจอ: ' + sh.onscreen);
    });
    return out.join('\n');
  }
  function parseScript(text) {
    const warns = [], m = { title: 'คลิปของฉัน', shots: [] }; let cur = null;
    for (const raw of text.split('\n')) {
      const line = raw.trim(); if (!line || line === '---') continue; let mm;
      if ((mm = /^ชื่อเรื่อง\s*[:：]\s*(.+)$/.exec(line))) { m.title = mm[1].trim(); continue; }
      if ((mm = /^\[\s*\d+\s*\]\s*(.*)$/.exec(line))) { const head = mm[1], d = /(\d+(?:\.\d+)?)\s*วิ/.exec(head); cur = { role: head.split(/[·|]/)[0].trim() || 'ช็อต', dur: d ? +d[1] : 4, actors: [], text: '', onscreen: '' }; m.shots.push(cur); continue; }
      if (!cur) continue;
      if ((mm = /^ตัวละคร\s*[:：]\s*(.*)$/.exec(line))) {
        for (const part of mm[1].split(/[,，、]/)) {
          const [nm, ps] = part.split('=').map((x) => (x || '').trim()); if (!nm) continue;
          const id = charIdOf(nm), pose = POSES.includes(ps) ? ps : POSE_ID[ps] || (ps ? null : 'idle');
          if (!id) { warns.push(`ช็อต ${m.shots.length}: ไม่รู้จักตัวละคร "${nm}" (สร้างได้ในขั้นที่ 3)`); continue; }
          if (!pose) warns.push(`ช็อต ${m.shots.length}: ไม่รู้จักท่า "${ps}" ใช้ "ยืน" แทน`);
          if (cur.actors.length >= MAX_CAST) { warns.push(`ช็อต ${m.shots.length}: ใส่ได้ไม่เกิน ${MAX_CAST} ตัวต่อช็อต`); continue; }
          cur.actors.push({ id, pose: pose || 'idle' });
        }
        continue;
      }
      if ((mm = /^บรรยาย\s*[:：]\s*(.*)$/.exec(line))) { cur.text = mm[1]; continue; }
      if ((mm = /^บนจอ\s*[:：]\s*(.*)$/.exec(line))) { cur.onscreen = mm[1]; continue; }
      cur.text = (cur.text ? cur.text + ' ' : '') + line;
    }
    let total = 0;
    m.shots.forEach((sh, i) => {
      total += sh.dur;
      if (!sh.actors.length) { sh.actors = [{ id: state.cast[0] || 'narrator', pose: 'talk' }]; warns.push(`ช็อต ${i + 1}: ไม่มีตัวละคร ใส่ ${nameOf(sh.actors[0].id)} ให้ก่อน`); }
      const rate = [...sh.text].length / sh.dur;
      if (rate > 13 && !state.audioSynced) warns.push(`ช็อต ${i + 1}: บรรยายยาวเกินเวลา (${rate.toFixed(0)} ตัวอักษร/วินาที ควรไม่เกิน 12)`);
      if ([...sh.onscreen].length > 28) warns.push(`ช็อต ${i + 1}: ตัวหนังสือบนจอยาวไป ควรเป็น 3-7 คำ`);
    });
    if (!m.shots.length) warns.push('ยังไม่มีช็อต เริ่มด้วยบรรทัด [1] ฮุก · 3 วิ');
    else if (!state.scriptAuto && !state.audioSynced && Math.abs(total - state.length) > state.length * 0.35) warns.push(`ยาวรวม ${total.toFixed(1)} วิ แต่ตั้งไว้ ${state.length} วิ`);
    return { model: m, warns };
  }
  function showWarns(list) { const ul = $('warns'); ul.innerHTML = ''; for (const w of list) ul.appendChild(mk('li', null, w)); ul.hidden = !list.length; }
  function scriptStory() {
    const { model, warns } = parseScript($('script').value); showWarns(warns);
    const shots = model.shots.length ? model.shots : [{ dur: 3, text: 'เขียนบทในขั้นที่ 2', actors: [{ id: 'narrator', pose: 'talk' }] }];
    return buildStory(model.title, shots.map((s) => ({ ...s, title: s.onscreen })));
  }
  function starterScript() {
    const th = themeOf(); if (th.starter) return serialize(th.starter);
    const [a, b, c] = [th.cast[0], th.cast[1] || th.cast[0], th.cast[2] || th.cast[0]], ex = th.examples[0];
    return serialize({ title: ex.slice(0, 40), shots: [
      { role: 'ฮุก', dur: 3, onscreen: ex.slice(0, 18), text: ex + '…', actors: [{ id: a, pose: 'shock' }] },
      { role: 'ตั้งปม', dur: 4, onscreen: 'แต่ไม่มีใครรู้…', text: 'แต่เรื่องนี้… มีอะไรมากกว่าที่คิด', actors: [{ id: b, pose: 'talk' }, { id: a, pose: 'idle' }] },
      { role: 'เฉลย', dur: 4, onscreen: 'คำตอบคือ…', text: 'กด AI เขียนบท เพื่อเล่าเรื่องนี้ให้จบ', actors: [{ id: c, pose: 'happy' }] },
      { role: 'CTA', dur: 3, onscreen: 'คิดว่ายังไง?', text: 'คุณคิดว่ายังไง… บอกไว้ในคอมเมนต์', actors: [{ id: a, pose: 'talk' }] }] });
  }
  function setScript(text, keepPrev) {
    if (keepPrev) { state.prevScript = $('script').value; $('undo-script').hidden = false; }
    $('script').value = text; state.scriptAuto = false;
  }

  /* ================= stage, transport, storyboard ================= */
  const canvas = $('c');
  async function sampleStory(id) { if (!state.stories[id]) { const s = SAMPLES.find((x) => x.id === id); state.stories[id] = await (await fetch(s.file)).json(); } return state.stories[id]; }
  async function refresh() {
    const story = state.storyId === 'mine' ? scriptStory() : await sampleStory(state.storyId);
    const [W, H] = ASPECTS[state.aspect].size, dpr = Math.min(2, window.devicePixelRatio || 1);
    state.total = window.init({ W: Math.round(W * dpr), H: Math.round(H * dpr), story, style: state.look, scene: state.scene });
    canvas.style.width = W + 'px'; canvas.style.aspectRatio = W + ' / ' + H; canvas.style.height = 'auto';
    if (state.t > state.total) state.t = 0;
    $('meta').textContent = `${story.title} · ${LOOKS[state.look].label} · ${sceneLabel(state.scene)} · ${state.aspect}${audioActive() ? ' · ซิงก์กับไฟล์เสียง' : ''}`;
    castPalette(); buildBoard(story, W, H); saveDraft();
  }
  let boardShots = [];
  function buildBoard(story, W, H) {
    const box = $('board'); box.innerHTML = ''; boardShots = [];
    let start = 0; const tw = 180, th = Math.round(tw * H / W);
    story.shots.forEach((sh, i) => {
      const dur = sh.dur; window.draw(start + Math.min(dur * 0.6, Math.max(0, dur - 0.3)));
      const b = mk('button', 'shot'); b.type = 'button';
      const cv = mk('canvas'); cv.width = tw; cv.height = th; cv.getContext('2d').drawImage(canvas, 0, 0, tw, th);
      const cap = mk('div', 'cap'); cap.append(mk('span', null, `#${i + 1}`), mk('span', null, `${start.toFixed(1)}s`));
      const s0 = start; b.addEventListener('click', () => seekTo(s0 + 0.01, true));
      b.append(cv, cap, mk('p', null, sh.text || sh.title || '')); box.appendChild(b); boardShots.push({ b, start, end: start + dur });
      start += dur;
    });
    $('board-sum').textContent = `${story.shots.length} ช็อต · ${start.toFixed(1)} วิ`;
    window.draw(state.t);
  }
  const audioActive = () => !!(state.audio && state.audioSynced && state.storyId === 'mine');
  function seekTo(t, play) {
    state.t = Math.max(0, Math.min(t, state.total - 0.001));
    if (audioActive()) { state.audio.el.currentTime = state.t; if (play) state.audio.el.play().catch(() => {}); }
    if (play) setPlaying(true);
  }
  function setPlaying(p) {
    state.playing = p; $('play').textContent = p ? '❚❚' : '▶'; $('play').setAttribute('aria-label', p ? 'หยุด' : 'เล่น');
    if (state.audio) { if (p && audioActive()) state.audio.el.play().catch(() => {}); else state.audio.el.pause(); }
  }
  let last = performance.now(), tick = 0, recClock = null;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (audioActive() && (state.playing || state.recording)) state.t = state.audio.el.currentTime;
    else if (state.recording) state.t = (now - recClock) / 1000;
    else if (state.playing) { state.t += dt; if (state.t >= state.total) state.t = 0; }
    try { window.draw(Math.min(state.t, state.total - 0.001)); } catch (e) { /* not ready */ }
    $('seek').value = String(Math.round(state.t / state.total * 1000));
    $('time').textContent = `${state.t.toFixed(1)} / ${state.total.toFixed(1)} วิ`;
    if (state.recording) { $('export-bar').firstChild.style.width = Math.min(100, state.t / state.total * 100) + '%'; if (state.t >= state.total) finishRecording(); }
    if ((tick = (tick + 1) % 3) === 0) { castTick(state.t); for (const s of boardShots) s.b.setAttribute('aria-current', String(state.t >= s.start && state.t < s.end)); }
    requestAnimationFrame(frame);
  }

  /* ================= themes ================= */
  function drawSceneThumb(c, w, h, look, scene, cast) {
    const P = look.palette ? look.palette(scene) : scene;
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.skyTop); g.addColorStop(1, P.skyBot); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = P.hill1; c.beginPath(); c.moveTo(0, h * 0.8); for (let x = 0; x <= w; x += 10) c.lineTo(x, h * 0.74 - Math.sin(x / 40) * h * 0.07); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = P.grass; c.fillRect(0, h * 0.83, w, h * 0.17);
    (cast || []).slice(0, 3).forEach((id, k, arr) => { c.save(); c.translate(w * (arr.length === 1 ? 0.5 : 0.23 + k * 0.28), h * 0.87); c.scale(h / 450, h / 450); Rig.draw(c, id, ['talk', 'happy', 'shock'][k], 0.4, P, { look, fx: false, facing: k === 2 ? -1 : 1 }); c.restore(); });
    LookLib.post(c, look, w, h, 0.4);
  }
  function buildThemes() {
    for (const ct of CATS) {
      const b = mk('button', 'chip'); b.type = 'button'; b.dataset.id = ct.id; b.textContent = ct.label;
      b.appendChild(mk('small', null, String(ct.id === 'all' ? THEMES.length : THEMES.filter((t) => t.cat === ct.id).length)));
      b.addEventListener('click', () => { state.cat = ct.id; filterThemes(); }); $('cats').appendChild(b);
    }
    for (const th of THEMES) {
      const b = mk('button', 'theme'); b.type = 'button'; b.dataset.id = th.id;
      const cv = mk('canvas'); cv.width = 300; cv.height = 190; drawSceneThumb(cv.getContext('2d'), 300, 190, LOOKS[th.look], SCENES[th.scene], th.cast);
      b.append(cv, mk('b', null, th.label), mk('span', null, th.desc)); b.addEventListener('click', () => applyTheme(th.id)); $('themes').appendChild(b);
    }
  }
  function filterThemes() {
    for (const b of $('cats').children) b.setAttribute('aria-pressed', String(b.dataset.id === state.cat));
    for (const b of $('themes').children) b.hidden = state.cat !== 'all' && THEMES.find((t) => t.id === b.dataset.id).cat !== state.cat;
  }
  function applyTheme(id, keep) {
    const th = THEMES.find((t) => t.id === id) || THEMES[0]; state.theme = th.id;
    if (!keep) {
      Object.assign(state, { look: th.look, scene: th.scene, cast: th.cast.slice(), length: th.length, hooks: [], hook: -1, scriptAuto: true, audioSynced: false });
      $('idea').value = th.examples[0]; $('script').value = starterScript(); $('hooks').innerHTML = ''; $('qa').hidden = true; $('extras').hidden = true;
      for (const n of ['hooks', 'story', 'qa', 'ideas', 'make']) note(n, '');
      if (state.audio) state.audio.el.pause();
    }
    const nt = $('theme-note'); nt.innerHTML = '';
    nt.append(mk('b', null, th.label), mk('div', null, th.desc), mk('span', null, 'ทำไมน่าทำ: ' + th.why), mk('span', null, `ตั้งให้แล้ว: ${LOOKS[th.look].label} · ${sceneLabel(th.scene)} · ${th.cast.map(nameOf).join(', ')} · ${th.length} วิ (เปลี่ยนได้ในขั้นถัดไป)`));
    const ib = $('ideas'); ib.innerHTML = '';
    for (const ex of th.examples) { const b = mk('button', 'chip', ex); b.type = 'button'; b.addEventListener('click', () => { $('idea').value = ex; saveDraft(); }); ib.appendChild(b); }
    for (const b of $('themes').children) b.setAttribute('aria-pressed', String(b.dataset.id === th.id));
    buildCast(); buildScenes(); syncAll(); showStory('mine');
  }

  /* ================= cast, scenes, looks, aspects, lengths ================= */
  const tiles = [];
  function buildCast() {
    const box = $('cast'); box.innerHTML = ''; tiles.length = 0;
    const ids = [...state.custom.chars, ...Object.keys(CH).filter((id) => !state.custom.chars.includes(id))];
    for (const id of ids) {
      const b = mk('button', 'tile'); b.type = 'button'; b.id = 'cast-' + id;
      const cv = mk('canvas'); cv.width = 180; cv.height = 180; const badge = mk('span', 'badge');
      b.append(badge, cv, mk('b', null, nameOf(id))); if (state.custom.chars.includes(id)) b.appendChild(mk('span', 'new', 'ใหม่'));
      b.addEventListener('click', () => toggleCast(id)); box.appendChild(b); tiles.push({ id, b, badge, ctx: cv.getContext('2d') });
    }
    syncCast();
  }
  function toggleCast(id) { const i = state.cast.indexOf(id); if (i >= 0) state.cast.splice(i, 1); else { if (state.cast.length >= MAX_CAST) state.cast.shift(); state.cast.push(id); } syncCast(); saveDraft(); }
  function syncCast() { for (const t of tiles) { const k = state.cast.indexOf(t.id); t.b.setAttribute('aria-pressed', String(k >= 0)); t.badge.textContent = k >= 0 ? k + 1 : ''; } $('cast-count').textContent = `เลือกแล้ว ${state.cast.length}/${MAX_CAST}`; }
  let castP;
  function castPalette() { const look = LOOKS[state.look], base = SCENES[state.scene]; castP = look.palette ? look.palette(base) : base; }
  function castTick(t) {
    const look = LOOKS[state.look], tq = look.stepFps ? Math.floor(t * look.stepFps) / look.stepFps : t;
    for (const tile of tiles) {
      if (!tile.b.isConnected) continue;
      const c = tile.ctx, sel = state.cast.includes(tile.id); c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      const g = c.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, castP.skyTop); g.addColorStop(1, castP.skyBot); c.fillStyle = g; c.fillRect(0, 0, 180, 180);
      c.fillStyle = castP.grass; c.fillRect(0, 152, 180, 28); c.translate(84, 156); c.scale(0.56, 0.56);
      Rig.draw(c, tile.id, sel ? 'walk' : 'idle', tq, castP, { look, fx: false }); c.restore(); LookLib.post(c, look, 180, 180, tq);
    }
    for (const m of makerViews) m.draw(tq);
  }
  function chipRow(boxId, items, key, after) {
    const box = $(boxId); box.innerHTML = '';
    for (const it of items) {
      const b = mk('button', 'chip', it.label); b.type = 'button'; b.dataset.id = it.id; if (it.note) b.appendChild(mk('small', null, it.note));
      b.addEventListener('click', () => { state[key] = it.id; syncAll(); (after || refresh)(); }); box.appendChild(b);
    }
  }
  const buildScenes = () => chipRow('scenes', [...state.custom.scenes.map((id) => ({ id, label: sceneLabel(id), note: 'ใหม่' })), ...Object.keys(SCENES).filter((id) => !state.custom.scenes.includes(id)).map((id) => ({ id, label: sceneLabel(id) }))], 'scene');
  function buildStatic() {
    chipRow('looks', Object.entries(LOOKS).map(([id, l]) => ({ id, label: l.label })), 'look');
    chipRow('lengths', LENGTHS.map((n) => ({ id: n, label: n + ' วิ' })), 'length', saveDraft);
    for (const [id, a] of Object.entries(ASPECTS)) {
      const b = mk('button', 'aspect'); b.type = 'button'; b.dataset.id = id;
      const [w, h] = a.size, k = 34 / Math.max(w, h), i = mk('i'); i.style.width = w * k + 'px'; i.style.height = h * k + 'px';
      b.append(i, document.createTextNode(`${id} ${a.th}`), mk('small', null, a.use));
      b.addEventListener('click', () => { state.aspect = id; syncAll(); refresh(); }); $('aspects').appendChild(b);
    }
    const sb = $('stories');
    for (const it of [{ id: 'mine', label: 'บทของฉัน' }, ...SAMPLES.map((s) => ({ ...s, note: 'ตัวอย่าง' }))]) {
      const b = mk('button', 'chip', it.label); b.type = 'button'; b.dataset.id = it.id; if (it.note) b.appendChild(mk('small', null, it.note));
      b.addEventListener('click', () => showStory(it.id)); sb.appendChild(b);
    }
  }
  function syncAll() {
    for (const [box, key] of [['scenes', 'scene'], ['looks', 'look'], ['lengths', 'length'], ['stories', 'storyId']]) for (const b of $(box).children) b.setAttribute('aria-pressed', String(String(b.dataset.id) === String(state[key])));
    for (const b of $('aspects').children) b.setAttribute('aria-pressed', String(b.dataset.id === state.aspect));
    syncCast();
  }
  function showStory(id) { state.storyId = id; state.t = 0; if (state.audio && !audioActive()) state.audio.el.pause(); syncAll(); refresh().then(() => { if (audioActive()) { state.audio.el.currentTime = 0; if (state.playing) state.audio.el.play().catch(() => {}); } }); }

  /* ================= images ================= */
  for (const sec of ['story', 'make', 'look', 'aspect']) {
    $('img-' + sec).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = '';
      if (sec === 'aspect') return aspectFromImage(f);
      state.images[sec] = f; showThumb(sec);
    });
  }
  function showThumb(sec) {
    const box = $('thumb-' + sec), f = state.images[sec]; box.innerHTML = ''; if (!f) { box.hidden = true; return; }
    const img = mk('img'); img.alt = 'ภาพอ้างอิง'; img.src = URL.createObjectURL(f);
    const rm = mk('button', null, 'เอาออก'); rm.type = 'button'; rm.addEventListener('click', () => { delete state.images[sec]; showThumb(sec); });
    box.append(img, mk('span', null, f.name + ' · AI จะดูภาพนี้ด้วย'), rm); box.hidden = false;
  }
  function aspectFromImage(f) {
    const img = new Image(); img.onload = () => { const r = img.naturalWidth / img.naturalHeight, id = r < 0.8 ? '9:16' : r > 1.25 ? '16:9' : '1:1'; state.aspect = id; syncAll(); refresh(); note('aspect', `ภาพกว้าง ${img.naturalWidth} × สูง ${img.naturalHeight} จึงเลือก ${id} ${ASPECTS[id].th}`); };
    img.src = URL.createObjectURL(f);
  }
  function note(sec, text, err) { const n = $('note-' + sec); if (!n) return; n.textContent = text; n.hidden = !text; n.classList.toggle('err', !!err); }

  /* ================= custom characters & scenes ================= */
  const HEX = /^#[0-9a-f]{6}$/i;
  const HUMAN_ENUM = { hair: { short: 'สั้น', side: 'แสกข้าง', long: 'ยาว', ponytail: 'หางม้า', bun: 'มวย', bob: 'บ็อบ' }, top: { shirt: 'เสื้อ', coat: 'เสื้อคลุม', suit: 'สูท' }, bottom: { pants: 'กางเกงขายาว', shorts: 'ขาสั้น', skirt: 'กระโปรง', longskirt: 'กระโปรงยาว' }, hat: { none: 'ไม่มีหมวก', fedora: 'หมวกนักสืบ', straw: 'หมวกสาน' }, age: { child: 'เด็ก', adult: 'ผู้ใหญ่', elder: 'ผู้สูงวัย' } };
  const HUMAN_EXTRAS = { glasses: 'แว่น', tie: 'เนกไท', apron: 'ผ้ากันเปื้อน', stethoscope: 'หูฟังหมอ', book: 'หนังสือ', magnifier: 'แว่นขยาย', cane: 'ไม้เท้า', blush: 'แก้มแดง' };
  const CRITTER_ENUM = { ears: { long: 'หูยาว', pointy: 'หูแหลม', round: 'หูกลม', big: 'หูใหญ่', floppy: 'หูตก', pig: 'หูหมู', frog: 'ตาโปน' }, tail: { puff: 'หางปุย', long: 'หางยาว', bushy: 'หางพวง', curl: 'หางม้วน', stub: 'หางสั้น', none: 'ไม่มีหาง' }, snout: { none: 'ปากเล็ก', muzzle: 'ปากยื่น', pointed: 'จมูกแหลม', pig: 'จมูกหมู' } };
  const CRITTER_MARKS = { whiskers: 'หนวด', stripes: 'ลาย', patches: 'รอบตาดำ' };
  const HUMAN_COLORS = { skin: 'ผิว', hair: 'ผม', top: 'เสื้อ', bottom: 'กางเกง/กระโปรง', inner: 'ด้านใน', shoe: 'รองเท้า', accent: 'ของใช้' };
  const CRITTER_COLORS = { fur: 'ขน', belly: 'ท้อง', inner: 'ในหู', accent: 'ลาย', nose: 'จมูก' };
  const SCENE_ENUM = { sky: { day: 'กลางวัน', sunset: 'เย็น', night: 'กลางคืน' }, backdrop: { hills: 'เนินเขา', mountains: 'ภูเขา', dunes: 'เนินทราย', sea: 'ทะเล', city: 'ตึกเมือง', forest: 'ป่าสน' }, particles: { none: 'ไม่มี', snow: 'หิมะ', stars: 'ดาว', leaves: 'ใบไม้ร่วง', bubbles: 'ฟองอากาศ' } };
  const SCENE_COLORS = { skyTop: 'ฟ้าบน', skyBot: 'ฟ้าล่าง', hill1: 'เขาไกล', hill2: 'เขาใกล้', grass: 'พื้น', treeTop: 'ต้นไม้', sun: 'ดวงอาทิตย์', accent: 'สีเน้น' };
  const DEF = {
    human: { colors: { skin: '#e3ad86', hair: '#2b2220', top: '#4f86c6', inner: '#ffffff', bottom: '#3a3f4a', shoe: '#3a2b24', accent: '#e2572c' }, features: { hair: 'short', top: 'shirt', bottom: 'pants', hat: 'none', extras: [] }, age: 'adult' },
    critter: { colors: { fur: '#c9a27e', belly: '#f6eadc', inner: '#ffb3c1', accent: '#8b5e3c', nose: '#3a2b24' }, features: { ears: 'round', tail: 'stub', snout: 'muzzle' } },
    scene: { sky: 'day', backdrop: 'hills', particles: 'none', colors: { skyTop: '#8fd3ff', skyBot: '#e9f8ff', hill1: '#9fd68a', hill2: '#7cc072', grass: '#5fae56', treeTop: '#7cc072', sun: '#ffd84a', accent: '#ff7043' } }
  };
  const pick = (v, en, d) => (Object.prototype.hasOwnProperty.call(en, v) ? v : d);
  const col = (v, d) => (HEX.test(v || '') ? v : d);
  let uid = 0; const newId = (p) => `${p}${Date.now().toString(36)}${(uid++).toString(36)}`;
  function uniqueName(n, fallback) { let name = String(n || fallback).trim().slice(0, 24) || fallback, k = 2; while (charIdOf(name) || Object.keys(SCENES).some((s) => sceneLabel(s) === name)) name = `${String(n || fallback).slice(0, 20)} ${k++}`; return name; }
  function makeChar(spec, id) {
    const tpl = spec.template === 'critter' ? 'critter' : 'human', d = DEF[tpl], f = spec.features || {}, c = spec.colors || {};
    const ch = { template: tpl, label: spec.label || uniqueName(spec.name, tpl === 'human' ? 'ตัวละครใหม่' : 'สัตว์ใหม่'), role: spec.role || '', colors: {}, features: {} };
    for (const k of Object.keys(d.colors)) ch.colors[k] = col(c[k], d.colors[k]);
    if (tpl === 'human') {
      for (const k of ['hair', 'top', 'bottom', 'hat']) ch.features[k] = pick(f[k], HUMAN_ENUM[k], d.features[k]);
      ch.features.extras = (Array.isArray(f.extras) ? f.extras : []).filter((x) => HUMAN_EXTRAS[x]).slice(0, 3);
      const age = pick(spec.age || (f.elder ? 'elder' : f.scale < 1 ? 'child' : 'adult'), HUMAN_ENUM.age, 'adult');
      ch.age = age; if (age === 'child') ch.features.scale = 0.82; if (age === 'elder') { ch.features.elder = true; if (ch.colors.hair === d.colors.hair) ch.colors.hair = '#d9d9d9'; }
      ch.bbox = [-98, -260, 120, 28];
    } else {
      for (const k of ['ears', 'tail', 'snout']) ch.features[k] = pick(f[k], CRITTER_ENUM[k], d.features[k]);
      for (const k of Object.keys(CRITTER_MARKS)) if (f[k]) ch.features[k] = true;
      if (ch.features.patches) ch.features.darkLegs = true;
      ch.bbox = [-118, -260, 122, 15];
    }
    CH[id] = ch; return id;
  }
  function makeScene(spec, id) {
    const d = DEF.scene, c = spec.colors || {}, sky = pick(spec.sky, SCENE_ENUM.sky, d.sky), particles = pick(spec.particles, SCENE_ENUM.particles, 'none');
    const sc = { label: spec.label || uniqueName(spec.name, 'ฉากใหม่'), sky, backdrop: pick(spec.backdrop, SCENE_ENUM.backdrop, d.backdrop), particles: particles === 'none' ? null : particles,
      line: '#3a2b24', sub: 'rgba(20,20,30,.72)', subText: '#ffffff', cloud: sky === 'night' ? '#5a62a6' : '#ffffff', sunOn: true, snowcap: particles === 'snow', track: '#e8c98f', trackDash: '#fff6df' };
    for (const k of Object.keys(d.colors)) sc[k] = col(c[k], d.colors[k]);
    SCENES[id] = sc; return id;
  }
  const makerViews = [];
  function buildMakers() {
    const box = $('makers'); box.innerHTML = ''; makerViews.length = 0;
    for (const id of state.custom.scenes) box.appendChild(sceneMaker(id));
    for (const id of state.custom.chars) box.appendChild(charMaker(id));
  }
  function sel(labelText, en, value, onChange) { const s = mk('select'); s.setAttribute('aria-label', labelText); for (const [k, v] of Object.entries(en)) { const o = mk('option', null, v); o.value = k; if (k === value) o.selected = true; s.appendChild(o); } s.addEventListener('change', () => onChange(s.value)); return s; }
  function checks(map, isOn, onToggle) { const w = mk('div', 'swatches'); for (const [k, v] of Object.entries(map)) { const l = mk('label'); const i = mk('input'); i.type = 'checkbox'; i.checked = isOn(k); i.style.width = '18px'; i.style.height = '18px'; i.addEventListener('change', () => onToggle(k, i.checked)); l.append(i, document.createTextNode(v)); w.appendChild(l); } return w; }
  function swatches(map, obj, onChange) { const w = mk('div', 'swatches'); for (const [k, v] of Object.entries(map)) { const l = mk('label'); const i = mk('input'); i.type = 'color'; i.value = obj[k]; i.setAttribute('aria-label', v); i.addEventListener('input', () => { obj[k] = i.value; onChange(); }); l.append(i, document.createTextNode(v)); w.appendChild(l); } return w; }
  const changed = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => { buildCast(); buildScenes(); syncAll(); refresh(); }, 250); }; })();
  function charMaker(id) {
    const ch = CH[id], card = mk('div', 'maker'), cv = mk('canvas'); cv.width = 192; cv.height = 192; const c = cv.getContext('2d');
    makerViews.push({ draw: (t) => { if (!CH[id]) return; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = castP ? castP.skyBot : '#eee'; c.fillRect(0, 0, 192, 192); c.fillStyle = castP ? castP.grass : '#ccc'; c.fillRect(0, 160, 192, 32); c.save(); c.translate(90, 166); c.scale(0.6, 0.6); Rig.draw(c, id, 'walk', t, castP, { look: LOOKS[state.look], fx: false }); c.restore(); } });
    const f = mk('div', 'f'), name = mk('input'); name.type = 'text'; name.value = ch.label; name.setAttribute('aria-label', 'ชื่อตัวละคร'); name.className = 'wide';
    name.addEventListener('change', () => { const old = ch.label, nn = name.value.trim() || old; if (nn !== old) { ch.label = nn; $('script').value = $('script').value.replaceAll(old + '=', nn + '='); changed(); } });
    f.append(mk('span', 'kind wide', ch.template === 'human' ? 'ตัวละครคน' : 'ตัวละครสัตว์'), name);
    if (ch.template === 'human') {
      for (const k of ['hair', 'top', 'bottom', 'hat']) f.appendChild(sel(k, HUMAN_ENUM[k], ch.features[k], (v) => { ch.features[k] = v; changed(); }));
      f.appendChild(sel('อายุ', HUMAN_ENUM.age, ch.age || 'adult', (v) => { ch.age = v; delete ch.features.scale; delete ch.features.elder; if (v === 'child') ch.features.scale = 0.82; if (v === 'elder') ch.features.elder = true; changed(); }));
      f.appendChild(checks(HUMAN_EXTRAS, (k) => ch.features.extras.includes(k), (k, on) => { ch.features.extras = on ? [...ch.features.extras, k].slice(-3) : ch.features.extras.filter((x) => x !== k); changed(); }));
      f.appendChild(swatches(HUMAN_COLORS, ch.colors, changed));
    } else {
      for (const k of ['ears', 'tail', 'snout']) f.appendChild(sel(k, CRITTER_ENUM[k], ch.features[k], (v) => { ch.features[k] = v; changed(); }));
      f.appendChild(checks(CRITTER_MARKS, (k) => !!ch.features[k], (k, on) => { if (on) ch.features[k] = true; else delete ch.features[k]; ch.features.darkLegs = !!ch.features.patches; changed(); }));
      f.appendChild(swatches(CRITTER_COLORS, ch.colors, changed));
    }
    if (ch.role) f.appendChild(mk('p', 'role', 'บทบาท: ' + ch.role));
    const del = mk('button', 'del', 'ลบตัวละครนี้'); del.type = 'button'; del.addEventListener('click', () => { state.custom.chars = state.custom.chars.filter((x) => x !== id); state.cast = state.cast.filter((x) => x !== id); delete CH[id]; buildMakers(); changed(); });
    f.appendChild(del); card.append(cv, f); return card;
  }
  function sceneMaker(id) {
    const sc = SCENES[id], card = mk('div', 'maker'), cv = mk('canvas'); cv.width = 192; cv.height = 192; const c = cv.getContext('2d');
    makerViews.push({ draw: () => { if (SCENES[id]) drawSceneThumb(c, 192, 192, LOOKS[state.look], SCENES[id], []); } });
    const f = mk('div', 'f'), name = mk('input'); name.type = 'text'; name.value = sc.label; name.className = 'wide'; name.setAttribute('aria-label', 'ชื่อฉาก');
    name.addEventListener('change', () => { sc.label = name.value.trim() || sc.label; changed(); });
    f.append(mk('span', 'kind wide', 'ฉาก'), name);
    for (const k of ['sky', 'backdrop', 'particles']) f.appendChild(sel(k, SCENE_ENUM[k], k === 'particles' ? sc.particles || 'none' : sc[k], (v) => { if (k === 'particles') { sc.particles = v === 'none' ? null : v; sc.snowcap = v === 'snow'; } else { sc[k] = v; if (k === 'sky') sc.cloud = v === 'night' ? '#5a62a6' : '#ffffff'; } changed(); }));
    const use = mk('button', 'btn', 'ใช้ฉากนี้'); use.type = 'button'; use.addEventListener('click', () => { state.scene = id; syncAll(); refresh(); });
    f.appendChild(use); f.appendChild(swatches(SCENE_COLORS, sc, changed));
    const del = mk('button', 'del', 'ลบฉากนี้'); del.type = 'button'; del.addEventListener('click', () => { state.custom.scenes = state.custom.scenes.filter((x) => x !== id); if (state.scene === id) state.scene = themeOf().scene; delete SCENES[id]; buildMakers(); changed(); });
    f.appendChild(del); card.append(cv, f); return card;
  }
  function addChar(spec) { const id = makeChar(spec, newId('c_')); state.custom.chars.unshift(id); return id; }
  function addScene(spec) { const id = makeScene(spec, newId('s_')); state.custom.scenes.unshift(id); return id; }
  $('add-char').addEventListener('click', () => { const id = addChar({ template: 'human' }); state.cast = [id, ...state.cast.filter((x) => x !== id)].slice(0, MAX_CAST); buildMakers(); buildCast(); syncAll(); note('make', `สร้าง "${nameOf(id)}" แล้ว ปรับทรงผม เสื้อผ้า สี ได้ที่การ์ด แล้วพิมพ์ชื่อนี้ในบทเพื่อให้ขึ้นจอ`); });
  $('add-scene').addEventListener('click', () => { const id = addScene({}); state.scene = id; buildMakers(); buildScenes(); syncAll(); refresh(); });

  /* ================= AI (sample capability) ================= */
  let sample = null, imagesOk = false;
  const ERR = { not_granted: 'ยังไม่ได้อนุญาตให้หน้านี้ใช้ Claude', sampling_disabled: 'บัญชีนี้ใช้ Claude จากหน้านี้ไม่ได้', rate_limited: 'เรียกใช้บ่อยเกินไป รอสักครู่แล้วลองใหม่', image_rejected: 'ใช้ภาพนี้ไม่ได้ ลองภาพ JPG หรือ PNG อื่น', invalid_json: 'AI ตอบกลับไม่ครบ ลองกดอีกครั้ง', refused: 'AI ไม่ตอบโจทย์นี้ ลองเปลี่ยนไอเดีย', session_expired: 'ต้องเข้าสู่ระบบใหม่' };
  const errText = (e) => ERR[e && e.code] || 'ติดต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้ง';
  const idea = () => $('idea').value.trim() || '(ไม่ได้ระบุ)';
  const castList = () => Object.keys(CH).map((id) => `${id} (${nameOf(id)}${CH[id].template === 'human' || CH[id].template === 'bean' ? ', คน' : ', สัตว์'})`).join(', ');
  function withImage(sec, prompt) { const f = state.images[sec]; return f && imagesOk ? [prompt + '\nมีภาพอ้างอิงแนบมาด้วย ให้ใช้ภาพนี้ประกอบการตัดสินใจ', { images: [f] }] : [prompt, {}]; }
  const VIRAL_RULES = `หลักคอนเทนต์ไวรัลที่ต้องใช้:
- ฮุก 0-3 วินาที: เปิดด้วย payoff เดิมพัน หรือภาพแปลก ห้ามทักทาย ห้าม "วันนี้เราจะมาพูดถึง" ห้ามเกริ่นตามลำดับเวลา พูดจบใน 2 วินาที (ไม่เกิน 9 คำ) มีคำนาม ตัวเลข หรือเดิมพันที่จับต้องได้ และเปิดคำถามค้างในหัวคนดู (open loop)
- ฮุก 3 ชั้นชี้ไอเดียเดียว: ภาพเฟรมแรก + คำพูด + ตัวหนังสือบนจอ 3-7 คำ (ตัวหนังสือทำให้คำพูดคมขึ้น ไม่พิมพ์ซ้ำ)
- โครง: ฮุก → ตั้งปม → เร่งเดิมพัน (เชื่อมด้วย "แต่" หรือ "ดังนั้น" ไม่ใช่ "แล้วก็") → re-hook กลางคลิป ("แต่จุดที่ไม่มีใครคาดคือ…") → หักมุมราว 70% ของคลิป → เฉลยที่ปิดทุก open loop → CTA เดียวต้นทุนต่ำ (เซฟไว้ / คอมเมนต์คำตอบ) ห้าม engagement bait
- ประโยคสั้นไม่เกิน 12 คำ ใส่ "…" ตรงจุดหยุดหายใจ (หลังฮุก ก่อนหักมุม ก่อนเฉลย) ความเร็วพากย์ราว 2.2-3 คำต่อวินาที
- เปลี่ยนช็อตทุก 2-4 วินาที ไม่มีช่วงยืด ตอนจบวนกลับประโยคแรกได้ถ้าเป็นธรรมชาติ
- คนดูเบื่อการเล่าเรียง 1-2-3: เปิดด้วยช่วงไฮไลต์ก่อน แล้วค่อยย้อนเล่า เล่าแบบจริงใจไม่ปรุงแต่ง
- สัญญาในฮุกต้องตรงกับสิ่งที่ส่งมอบ ห้ามคลิกเบต ห้ามแต่งตัวเลข สถิติ หรือคำพูดของคนจริง เรื่องจริงต้องแยกข้อเท็จจริงกับทฤษฎี`;
  const ARCHETYPES = 'ข้อเท็จจริงช็อก, ปลายเรื่องก่อน, นักสืบ, ครู, นักมายากล, สวนกระแส, หมอดู, นักทดลอง, กั๊กคำตอบ, ตัวเลขแปลก, click-to-unpause (เฟรมแรกกลางเหตุการณ์), คำถามที่ทุกคนเคยสงสัย';
  const fmtLabel = () => themeOf().label;
  const brief = () => `ไอเดีย: "${idea()}"\nธีม: ${themeOf().label} (โทน: ${themeOf().tone})\nกติกาของธีมนี้: ${themeOf().rules}\nความยาว: ${state.length} วินาที\nแพลตฟอร์ม: ${ASPECTS[state.aspect].use} (${state.aspect})\nฉาก: ${sceneLabel(state.scene)}\nตัวละครที่ใช้ได้ (id = ชื่อ): ${(state.cast.length ? state.cast : ['narrator']).map((id) => id + ' = ' + nameOf(id)).join(', ')}`;
  const SCRIPT_JSON = `{"title":"ชื่อเรื่อง","shots":[{"role":"ฮุก|ตั้งปม|เร่ง|re-hook|หักมุม|เฉลย|CTA","dur":3,"text":"เสียงบรรยาย","onscreen":"ตัวหนังสือบนจอ 3-7 คำ","actors":[{"id":"...","pose":"idle|walk|run|hop|sleep|shock|happy|sad|talk"}]}],"openLoop":"คำถามที่ค้างในหัวคนดู","reHook":"ประโยค re-hook","caption":"แคปชัน 1-2 บรรทัด ต่อยอดฮุก","hashtags":["#..."],"factsToCheck":["ข้อเท็จจริงที่ต้องหาแหล่งอ้างอิง"]}`;
  async function run(sec, btn, fn) {
    if (!sample) { note(sec, 'AI ใช้ได้เมื่อเปิดหน้านี้ใน claude.ai เท่านั้น', true); return; }
    btn.disabled = true; try { await fn(); } catch (e) { note(sec, errText(e), true); } finally { btn.disabled = false; }
  }
  const askIdeas = (btn) => run('ideas', btn, async () => {
    note('ideas', 'AI กำลังหาไอเดีย...');
    const [p, o] = withImage('story', `เสนอไอเดียคลิปสั้นแอนิเมชันภาษาไทย 5 ไอเดีย ธีม "${fmtLabel()}" (${themeOf().rules}) ยาว ${state.length} วินาที ต่อยอดจากโจทย์นี้ (ถ้ามี): "${$('idea').value.trim()}"\nเกณฑ์: มี "ปม" ที่คนอยากรู้คำตอบ เขียนฮุกแรงได้ เล่าจบในเวลาที่กำหนด ถ้าเป็นเรื่องจริงต้องตรวจสอบได้ และยังไม่ค่อยมีคลิปไทยทำ\nตอบเป็น JSON เท่านั้น: {"ideas":[{"idea":"ไอเดียประโยคเดียว","why":"ทำไมคนจะหยุดดู สั้นๆ"}]}`);
    const r = await sample.json(p, { modelTier: 'default', cache: false, ...o }); const box = $('ideas'); box.innerHTML = '';
    for (const it of (r.ideas || []).slice(0, 6)) { const b = mk('button', 'chip', it.idea); b.type = 'button'; b.title = it.why || ''; b.addEventListener('click', () => { $('idea').value = it.idea; note('ideas', 'ใช้ไอเดียนี้: ' + (it.why || '')); }); box.appendChild(b); }
    note('ideas', 'แตะไอเดียเพื่อใช้ แล้วไปขั้น ก.');
  });
  const askHooks = (btn) => run('hooks', btn, async () => {
    note('hooks', 'AI กำลังคิดฮุก...');
    const [p, o] = withImage('story', `คุณคือคนเขียนบทคลิปสั้นไวรัลภาษาไทย\n${brief()}\n\n${VIRAL_RULES}\n\nเขียนฮุก 6 แบบ จากอย่างน้อย 4 แนวที่ต่างกัน ให้น้ำหนักแนวที่เข้ากับธีม: ${themeOf().archetypes} และเลือกเพิ่มได้จาก: ${ARCHETYPES}\nแต่ละฮุกต้องผ่าน: พูดจบใน 2 วินาที, เปิดด้วย payoff หรือเดิมพัน, มีคำจับต้องได้ในครึ่งแรก, เปิดคำถามค้าง, เนื้อหาจ่ายคืนได้จริง\nตอบเป็น JSON เท่านั้น: {"hooks":[{"archetype":"ชื่อแนว","line":"คำพูด","onscreen":"ตัวหนังสือบนจอ 3-7 คำ","firstFrame":"ภาพเฟรมแรก","loop":"คำถามที่ค้างในหัวคนดู"}],"best":0,"why":"ทำไมตัวนี้แรงสุด 1 ประโยค"}`);
    const r = await sample.json(p, { modelTier: 'default', cache: false, ...o });
    state.hooks = (r.hooks || []).slice(0, 8); state.hook = Math.min(Math.max(0, +r.best || 0), state.hooks.length - 1);
    renderHooks(); note('hooks', `AI แนะนำฮุกที่ ${state.hook + 1}: ${r.why || ''} เลือกฮุกอื่นได้ แล้วไปขั้น ข.`);
  });
  function renderHooks() {
    const box = $('hooks'); box.innerHTML = '';
    state.hooks.forEach((h, i) => {
      const b = mk('button', 'hook'); b.type = 'button'; b.setAttribute('aria-pressed', String(i === state.hook));
      b.append(mk('span', 'tag', `ฮุก ${i + 1} · ${h.archetype || ''}`), mk('span', 'line', `"${h.line || ''}"`), mk('span', 'sub', `บนจอ: ${h.onscreen || '-'} · เฟรมแรก: ${h.firstFrame || '-'} · คนดูจะสงสัย: ${h.loop || '-'}`));
      b.addEventListener('click', () => { state.hook = i; renderHooks(); }); box.appendChild(b);
    });
  }
  function cleanShots(arr, limit) { return arr.slice(0, limit).map((s) => ({ role: s.role, dur: Math.min(8, Math.max(2, +s.dur || 3)), text: String(s.text || ''), onscreen: String(s.onscreen || ''), actors: (Array.isArray(s.actors) ? s.actors : []).map((a) => a && ({ id: CH[a.id] ? a.id : charIdOf(a.id), pose: a.pose })).filter((a) => a && a.id).slice(0, MAX_CAST) })); }
  function applyScriptJSON(r, sec) {
    if (!r || !Array.isArray(r.shots) || !r.shots.length) throw { code: 'invalid_json' };
    const shots = cleanShots(r.shots, 12); state.audioSynced = false;
    setScript(serialize({ title: r.title, shots }), true); renderExtras(r); showStory('mine');
    note(sec, `ได้บท "${r.title || ''}" ${shots.length} ช็อต แก้ข้อความในกล่องได้เลย แล้วกด "อัปเดตพรีวิวจากบท"`);
  }
  const askScript = (btn) => run('story', btn, async () => {
    note('story', 'AI กำลังเขียนบท อาจใช้เวลาครึ่งนาที...');
    const h = state.hooks[state.hook];
    const hookPart = h ? `ใช้ฮุกนี้เป็นช็อตแรก: คำพูด "${h.line}" ตัวหนังสือบนจอ "${h.onscreen}" เฟรมแรก "${h.firstFrame}" คำถามค้าง "${h.loop}"` : 'ยังไม่ได้เลือกฮุก ให้คิดฮุกที่แรงที่สุดเองตามหลักด้านล่าง';
    const n = Math.max(3, Math.min(10, Math.round(state.length / 4)));
    const [p, o] = withImage('story', `คุณคือคนเขียนบทคลิปสั้นแอนิเมชันไวรัลภาษาไทย\n${brief()}\n${hookPart}\n\n${VIRAL_RULES}\n\nข้อกำหนดบท: ${n} ช็อต (บวกลบ 1) รวมราว ${state.length} วินาที, ช็อตละ 2-6 วินาที, บรรยายช็อตละไม่เกิน (วินาที x 11) ตัวอักษร, ช็อตแรก role "ฮุก" ช็อตสุดท้าย role "CTA", ช็อตละ 1-4 ตัวละครจากรายการด้านบนเท่านั้น (ใช้ id), เลือกท่าให้ตรงอารมณ์\nตอบเป็น JSON เท่านั้น: ${SCRIPT_JSON}`);
    applyScriptJSON(await sample.json(p, { modelTier: 'default', cache: false, ...o }), 'story');
  });
  let lastQA = null;
  const askQA = (btn) => run('qa', btn, async () => {
    note('qa', 'AI กำลังตรวจบท...');
    lastQA = await sample.json(`คุณคือคนตรวจคลิปสั้นก่อนโพสต์ (QA) ตรวจบทนี้ตามหลักไวรัลและภาษาไทย\n${brief()}\n\n${VIRAL_RULES}\n\nบท:\n${$('script').value.slice(0, 6000)}\nตรวจ: 1) ฮุกพูดจบใน 2 วินาที เปิดด้วย payoff/เดิมพัน ไม่ทักทาย 2) ฮุก 3 ชั้นชี้ทางเดียวกัน 3) เนื้อหาส่งมอบตามที่ฮุกสัญญา 4) ปิดทุก open loop 5) มี re-hook ไม่มีช่วงยืด 6) CTA เดียว ไม่ใช่ engagement bait 7) ความยาวบรรยายเหมาะกับเวลา 8) คำผิดภาษาไทยและตัวเลขที่ต้องหาแหล่งอ้างอิง\nตอบเป็น JSON เท่านั้น: {"hookScore":7,"verdict":"พร้อมโพสต์|ผ่านแบบมีเงื่อนไข|ไม่ผ่าน","checks":[{"item":"หัวข้อที่ตรวจ","ok":true,"note":"สั้นๆ"}],"dropOff":{"shot":2,"why":"ทำไมคนจะเลื่อนหนีตรงนี้","fix":"วิธีแก้"},"spelling":[{"wrong":"","right":""}],"fixes":["สิ่งที่ควรแก้ เรียงจากสำคัญสุด"]}`, { modelTier: 'default', cache: false });
    renderQA(lastQA); note('qa', 'ตรวจเสร็จ กด "ให้ AI แก้ตามรายงาน" ถ้าต้องการ (ย้อนกลับได้)');
  });
  const box = (h, txt) => { const d = mk('div', 'box'); d.append(mk('h3', null, h), document.createTextNode(txt)); return d; };
  function renderQA(r) {
    const el = $('qa'); el.innerHTML = ''; el.hidden = false;
    const sc = mk('div', 'score'); sc.append(mk('span', null, 'คะแนนฮุก'), mk('strong', null, `${+r.hookScore || 0}/10`), mk('span', null, r.verdict || '')); el.appendChild(sc);
    const ul = mk('ul'); for (const c of r.checks || []) { const li = mk('li', c.ok ? 'ok' : 'bad'); li.append(mk('span', 'mark', c.ok ? '✓' : '!'), mk('span', null, `${c.item}${c.note ? ': ' + c.note : ''}`)); ul.appendChild(li); } el.appendChild(ul);
    if (r.dropOff) el.appendChild(box(`จุดที่คนน่าจะเลื่อนหนี: ช็อต ${r.dropOff.shot || '?'}`, `${r.dropOff.why || ''} → ${r.dropOff.fix || ''}`));
    if ((r.spelling || []).filter((s) => s.wrong).length) el.appendChild(box('คำผิด', r.spelling.filter((s) => s.wrong).map((s) => `${s.wrong} → ${s.right}`).join(' · ')));
    if ((r.fixes || []).length) el.appendChild(box('ควรแก้', r.fixes.map((f, i) => `${i + 1}. ${f}`).join('\n')));
    const fix = mk('button', 'btn ai', 'ให้ AI แก้ตามรายงาน'); fix.type = 'button'; fix.addEventListener('click', () => askFix(fix)); el.appendChild(fix);
  }
  const askFix = (btn) => run('qa', btn, async () => {
    note('qa', 'AI กำลังแก้บทตามรายงาน...');
    applyScriptJSON(await sample.json(`แก้บทคลิปสั้นภาษาไทยนี้ตามรายงานตรวจ โดยคงเรื่องและตัวละครเดิม\n${brief()}\n\n${VIRAL_RULES}\n\nรายงานตรวจ:\n${JSON.stringify(lastQA).slice(0, 4000)}\n\nบทเดิม:\n${$('script').value.slice(0, 6000)}\n\nตอบเป็น JSON เท่านั้น (บทที่แก้แล้วทั้งเรื่อง): ${SCRIPT_JSON}`, { modelTier: 'default', cache: false }), 'qa');
  });
  function renderExtras(r) {
    const el = $('extras'); el.innerHTML = '';
    if (r.openLoop) el.appendChild(box('คำถามค้างในหัวคนดู (open loop)', r.openLoop));
    if (r.reHook) el.appendChild(box('re-hook กลางคลิป', r.reHook));
    if (r.caption || (r.hashtags || []).length) el.appendChild(box('แคปชันและแฮชแท็ก', [r.caption, (r.hashtags || []).join(' ')].filter(Boolean).join('\n')));
    if ((r.factsToCheck || []).length) el.appendChild(box('ข้อเท็จจริงที่ต้องหาแหล่งอ้างอิงก่อนโพสต์', r.factsToCheck.map((f) => '• ' + f).join('\n')));
    el.hidden = !el.children.length;
  }
  /* section pickers */
  const PICK = {
    cast: [() => withImage('make', `เลือกตัวละครสำหรับคลิปสั้นภาษาไทย\n${brief()}\nตัวละครที่มี: ${castList()}\nเลือก 2-4 ตัวที่เหมาะที่สุด ถ้ามีภาพแนบ ให้เลือกตัวที่ใกล้เคียงคนหรือสัตว์ในภาพ\nตอบเป็น JSON เท่านั้น: {"ids":["id"],"reason":"เหตุผลสั้นๆ"}`), (r) => { const ids = (r.ids || []).map((x) => (CH[x] ? x : charIdOf(x))).filter(Boolean).slice(0, MAX_CAST); if (!ids.length) throw { code: 'invalid_json' }; state.cast = ids; syncCast(); return `${ids.map(nameOf).join(', ')}: ${r.reason || ''}`; }],
    look: [() => withImage('look', `เลือกสไตล์ภาพให้คลิปสั้น\n${brief()}\nสไตล์ที่มี: ${Object.entries(LOOKS).map(([k, v]) => k + ' (' + v.label + ')').join(', ')}\nถ้ามีภาพแนบ ให้เลือกสไตล์ที่ใกล้เคียงลายเส้นและสีของภาพ\nตอบเป็น JSON เท่านั้น: {"style":"id","reason":"เหตุผลสั้นๆ"}`), (r) => { if (!LOOKS[r.style]) throw { code: 'invalid_json' }; state.look = r.style; syncAll(); refresh(); return `${LOOKS[r.style].label}: ${r.reason || ''}`; }],
    aspect: [() => [`คลิปสั้นไอเดีย "${idea()}" ธีม ${themeOf().label} ควรใช้สัดส่วนจอไหน ตัวเลือก: 9:16 (TikTok/Reels/Shorts), 16:9 (YouTube/Facebook), 1:1 (โพสต์ฟีด)\nตอบเป็น JSON เท่านั้น: {"aspect":"9:16|16:9|1:1","reason":"เหตุผลสั้นๆ"}`, {}], (r) => { if (!ASPECTS[r.aspect]) throw { code: 'invalid_json' }; state.aspect = r.aspect; syncAll(); refresh(); return `${r.aspect}: ${r.reason || ''}`; }]
  };
  const askPick = (sec, btn) => run(sec, btn, async () => { note(sec, 'AI กำลังคิด...'); const [p, o] = PICK[sec][0](); note(sec, 'AI เลือกให้: ' + PICK[sec][1](await sample.json(p, { modelTier: 'quick', ...o }))); saveDraft(); });
  /* make characters + scenes from the script */
  const askMake = (btn) => run('make', btn, async () => {
    note('make', 'AI กำลังออกแบบตัวละครและฉากจากบท...');
    const enumTxt = (en) => Object.keys(en).join('|');
    const [p, o] = withImage('make', `คุณคือผู้ออกแบบตัวละครและฉากสำหรับแอนิเมชัน 2D แบบ chibi\n${brief()}\n\nบทปัจจุบัน:\n${$('script').value.slice(0, 5000)}\n
ออกแบบตัวละครใหม่ 2-4 ตัวที่เข้ากับเรื่องและบทบาทในบท (สีต้องต่างกันชัด จำง่าย) และฉาก 1-2 ฉากที่เข้ากับเหตุการณ์ ถ้ามีภาพแนบให้อิงลักษณะจากภาพ
ตัวละครคน: template "human", age ${enumTxt(HUMAN_ENUM.age)}, features {hair: ${enumTxt(HUMAN_ENUM.hair)}, top: ${enumTxt(HUMAN_ENUM.top)}, bottom: ${enumTxt(HUMAN_ENUM.bottom)}, hat: ${enumTxt(HUMAN_ENUM.hat)}, extras: [${Object.keys(HUMAN_EXTRAS).join('|')}] ไม่เกิน 3}, colors {${Object.keys(HUMAN_COLORS).join(', ')}} เป็น #rrggbb
ตัวละครสัตว์: template "critter", features {ears: ${enumTxt(CRITTER_ENUM.ears)}, tail: ${enumTxt(CRITTER_ENUM.tail)}, snout: ${enumTxt(CRITTER_ENUM.snout)}, whiskers/stripes/patches: true|false}, colors {${Object.keys(CRITTER_COLORS).join(', ')}}
ฉาก: sky ${enumTxt(SCENE_ENUM.sky)}, backdrop ${enumTxt(SCENE_ENUM.backdrop)}, particles ${enumTxt(SCENE_ENUM.particles)}, colors {${Object.keys(SCENE_COLORS).join(', ')}}
"replaces" คือชื่อตัวละครในบทปัจจุบันที่ตัวใหม่จะมาแทน (ว่างได้) ชื่อใหม่ต้องเป็นชื่อเรียกสั้นภาษาไทยที่ไม่ซ้ำกับตัวละครที่มีอยู่: ${Object.keys(CH).map(nameOf).join(', ')}
ตอบเป็น JSON เท่านั้น: {"characters":[{"name":"","replaces":"","role":"บทบาทในเรื่อง","template":"human","age":"adult","features":{},"colors":{}}],"scenes":[{"name":"","sky":"","backdrop":"","particles":"none","colors":{}}]}`);
    const r = await sample.json(p, { modelTier: 'default', cache: false, ...o });
    const chars = (r.characters || []).slice(0, 4), scenes = (r.scenes || []).slice(0, 2);
    if (!chars.length && !scenes.length) throw { code: 'invalid_json' };
    let script = $('script').value; const made = [];
    for (const c of chars) {
      const id = addChar(c); made.push(id);
      const old = c.replaces && charIdOf(String(c.replaces).trim());
      if (old) script = script.split('\n').map((l) => (/^ตัวละคร\s*[:：]/.test(l.trim()) ? l.replaceAll(nameOf(old) + '=', nameOf(id) + '=').replaceAll(old + '=', nameOf(id) + '=') : l)).join('\n');
    }
    const sceneIds = scenes.map((s) => addScene(s));
    if (script !== $('script').value) setScript(script, true);
    if (made.length) state.cast = made.slice(0, MAX_CAST);
    if (sceneIds.length) state.scene = sceneIds[0];
    buildMakers(); buildCast(); buildScenes(); syncAll(); showStory('mine');
    note('make', `สร้าง ${made.length} ตัวละคร ${sceneIds.length} ฉาก${script !== $('script').value ? '' : ''} แทนตัวละครเดิมในบทให้แล้ว ปรับรายละเอียดในการ์ดได้`);
  });

  /* ================= audio -> clip ================= */
  let actx = null;
  const getCtx = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());
  async function loadAudio(file) {
    if (!file || !/^audio\//.test(file.type || 'audio/')) return;
    note('audio', 'กำลังอ่านไฟล์เสียง...');
    try {
      const buf = await getCtx().decodeAudioData(await file.arrayBuffer());
      const data = buf.getChannelData(0), sr = buf.sampleRate, hop = Math.round(sr * 0.02), env = [];
      for (let i = 0; i + hop <= data.length; i += hop) { let s = 0; for (let j = i; j < i + hop; j += 4) s += data[j] * data[j]; env.push(Math.sqrt(s / (hop / 4))); }
      if (state.audio) { state.audio.el.pause(); URL.revokeObjectURL(state.audio.el.src); }
      const el = new Audio(URL.createObjectURL(file)); el.preload = 'auto';
      el.addEventListener('ended', () => { if (!state.recording) setPlaying(false); });
      state.audio = { el, env, dur: buf.duration, name: file.name, src: null };
      state.segs = segment(env, buf.duration); drawWave();
      $('audio-info').textContent = `${file.name} · ${buf.duration.toFixed(1)} วินาที · แบ่งได้ ${state.segs.length} ช็อตตามช่วงหยุดพูด`; $('audio-info').hidden = false;
      if (!$('transcript').value.trim()) $('transcript').value = parseScript($('script').value).model.shots.map((s) => s.text).filter(Boolean).join('\n');
      $('auto-audio').disabled = false; note('audio', 'พร้อมแล้ว ตรวจข้อความด้านบนให้ตรงกับเสียง แล้วกด "ทำคลิปจากเสียงอัตโนมัติ"');
    } catch (e) { note('audio', 'อ่านไฟล์นี้ไม่ได้ ลองไฟล์ MP3 หรือ WAV', true); }
  }
  /* cut at pauses: a shot is 2.5-6 s, cut at the deepest pause available */
  function segment(env, dur) {
    const fr = 0.02, sorted = env.slice().sort((a, b) => a - b), floor = sorted[Math.floor(sorted.length * 0.1)] || 0, peak = sorted[Math.floor(sorted.length * 0.95)] || 1;
    const thr = floor + (peak - floor) * 0.12, pauses = []; let run = 0;
    env.forEach((v, i) => { if (v < thr) run++; else { if (run * fr >= 0.25) pauses.push({ t: (i - run / 2) * fr, len: run * fr }); run = 0; } });
    const segs = []; let start = 0;
    while (dur - start > 6) {
      const cand = pauses.filter((p) => p.t > start + 2.5 && p.t < start + 6);
      // prefer a clear pause near 3.5 s so shots change every 2-4 s, as short-form pacing wants
      const score = (p) => p.len - 0.15 * Math.abs(p.t - (start + 3.5));
      const cut = cand.length ? cand.reduce((a, b) => (score(b) > score(a) ? b : a)).t : start + 5;
      segs.push([start, cut]); start = cut;
    }
    if (dur - start < 1.5 && segs.length) segs[segs.length - 1][1] = dur; else segs.push([start, dur]);
    state.thr = thr; return segs;
  }
  function drawWave() {
    const cv = $('wave'), c = cv.getContext('2d'), w = cv.width, h = cv.height, env = state.audio.env, mx = Math.max(...env) || 1; cv.hidden = false;
    const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--accent').trim() || '#e2572c', mut = css.getPropertyValue('--muted').trim() || '#888';
    c.clearRect(0, 0, w, h);
    state.segs.forEach(([a, b], i) => { c.fillStyle = i % 2 ? 'rgba(226,87,44,.08)' : 'rgba(226,87,44,.16)'; c.fillRect(a / state.audio.dur * w, 0, (b - a) / state.audio.dur * w, h); c.fillStyle = mut; c.font = '600 22px sans-serif'; c.fillText(String(i + 1), a / state.audio.dur * w + 6, 24); });
    c.fillStyle = acc; for (let x = 0; x < w; x++) { const i = Math.floor(x / w * env.length), v = env[i] / mx; c.fillRect(x, h / 2 - v * h * 0.42, 1, Math.max(1, v * h * 0.84)); }
  }
  function alignText(text, segs) {
    const tokens = text.split(/\s+/).map((x) => x.trim()).filter(Boolean); if (!tokens.length) return segs.map(() => '');
    const fr = 0.02, env = state.audio.env, voiced = segs.map(([a, b]) => { let n = 0; for (let i = Math.floor(a / fr); i < Math.min(env.length, b / fr); i++) if (env[i] >= state.thr) n++; return Math.max(1, n); });
    const vt = voiced.reduce((a, b) => a + b, 0), cum = []; let acc = 0; for (const v of voiced) { acc += v / vt; cum.push(acc); }
    const lens = tokens.map((t) => [...t].length), lt = lens.reduce((a, b) => a + b, 0), out = segs.map(() => []); let pos = 0;
    tokens.forEach((t, i) => { const mid = (pos + lens[i] / 2) / lt; pos += lens[i]; out[Math.min(segs.length - 1, cum.findIndex((c) => mid <= c + 1e-9))].push(t); });
    return out.map((x) => x.join(' '));
  }
  async function autoAudio(btn) {
    if (!state.audio) return; btn.disabled = true;
    try {
      const segs = state.segs, texts = alignText($('transcript').value, segs), base = parseScript($('script').value).model.shots;
      let plan = null;
      if (sample) {
        note('audio', 'AI กำลังจัดตัวละคร ท่า และตัวหนังสือให้ทุกช็อต...');
        try {
          plan = await sample.json(`จัดภาพให้คลิปแอนิเมชันที่มีเสียงพากย์อยู่แล้ว ช็อตละหนึ่งช่วงเสียงตามลำดับ ห้ามเพิ่มหรือลดจำนวนช็อต\n${brief()}\n${VIRAL_RULES}\n\nช่วงเสียง:\n${segs.map(([a, b], i) => `${i + 1}. (${(b - a).toFixed(1)} วิ) ${texts[i] || '(ไม่มีข้อความ)'}`).join('\n')}\n\nสำหรับแต่ละช่วงเลือก role (ฮุก ช่วงแรก, CTA ช่วงสุดท้าย), ตัวหนังสือบนจอ 3-7 คำที่ทำให้คำพูดคมขึ้น, และตัวละคร 1-4 ตัวจากรายการ (ใช้ id) พร้อมท่าที่ตรงอารมณ์ของประโยค\nตอบเป็น JSON เท่านั้น: {"title":"ชื่อเรื่อง","shots":[{"role":"","onscreen":"","actors":[{"id":"","pose":""}]}]}`, { modelTier: 'default', cache: false });
        } catch (e) { note('audio', errText(e) + ' ระบบจะจัดภาพจากบทแทน', true); plan = null; }
      }
      const planShots = plan && Array.isArray(plan.shots) ? cleanShots(plan.shots, segs.length) : [];
      const shots = segs.map(([a, b], i) => {
        const p = planShots[i], fb = base.length ? base[Math.min(base.length - 1, Math.floor(i * base.length / segs.length))] : null;
        return { role: (p && p.role) || (i === 0 ? 'ฮุก' : i === segs.length - 1 ? 'CTA' : 'ช็อต'), dur: b - a, text: texts[i], onscreen: (p && p.onscreen) || (fb && Math.floor(i * base.length / segs.length) !== Math.floor((i - 1) * base.length / segs.length) ? fb.onscreen : ''),
          actors: p && p.actors.length ? p.actors : fb ? fb.actors : [{ id: state.cast[0] || 'narrator', pose: 'talk' }] };
      });
      state.audioSynced = true;
      setScript(serialize({ title: (plan && plan.title) || parseScript($('script').value).model.title, shots }), true);
      showStory('mine'); setPlaying(true);
      note('audio', `ได้ ${shots.length} ช็อต ยาว ${state.audio.dur.toFixed(1)} วินาที ตรงกับเสียง${plan ? ' (AI จัดภาพให้)' : ' (จัดภาพจากบท)'} แก้บทในขั้นที่ 2 ได้ ระยะเวลาแต่ละช็อตคือช่วงเสียง ถ้าแก้วินาทีภาพจะไม่ตรงเสียง`);
    } finally { btn.disabled = false; }
  }
  $('audio-file').addEventListener('change', (e) => { loadAudio(e.target.files[0]); e.target.value = ''; });
  const drop = $('drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); loadAudio(e.dataTransfer.files[0]); });
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('audio-file').click(); } });
  $('auto-audio').addEventListener('click', (e) => autoAudio(e.currentTarget));

  /* ================= export (MediaRecorder, real time) ================= */
  let downloads = null, recorder = null, chunks = [];
  async function startRecording() {
    if (state.recording) return;
    if (!window.MediaRecorder || !canvas.captureStream) { $('export-note').textContent = 'เบราว์เซอร์นี้บันทึกวิดีโอไม่ได้ ลองใช้ Chrome หรือ Edge บนคอมพิวเตอร์'; return; }
    const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const stream = canvas.captureStream(30);
    if (audioActive()) {
      const ac = getCtx(); await ac.resume();
      if (!state.audio.src) { state.audio.src = ac.createMediaElementSource(state.audio.el); state.audio.src.connect(ac.destination); state.audio.dest = ac.createMediaStreamDestination(); state.audio.src.connect(state.audio.dest); }
      for (const tr of state.audio.dest.stream.getAudioTracks()) stream.addTrack(tr);
    }
    chunks = []; recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : undefined);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = saveRecording;
    $('export').disabled = true; $('export').textContent = 'กำลังบันทึก...'; $('export-bar').hidden = false; $('export-video').hidden = true;
    state.t = 0; state.recording = true; recClock = performance.now();
    recorder.start(250);
    if (audioActive()) { state.audio.el.currentTime = 0; await state.audio.el.play().catch(() => {}); }
  }
  function finishRecording() { if (!state.recording) return; state.recording = false; if (state.audio) state.audio.el.pause(); if (recorder && recorder.state !== 'inactive') recorder.stop(); }
  async function saveRecording() {
    const type = (recorder.mimeType || 'video/webm').split(';')[0], ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(chunks, { type });
    const name = (parseScript($('script').value).model.title || 'clip').replace(/[\\/:*?"<>|]/g, '').slice(0, 60) + '.' + ext;
    $('export').disabled = false; $('export').textContent = 'บันทึกเป็นวิดีโอ'; $('export-bar').hidden = true;
    const v = $('export-video'); v.src = URL.createObjectURL(blob); v.hidden = false;
    if (downloads) {
      try { await downloads.save({ filename: name, data: blob }); $('export-note').textContent = `บันทึกไฟล์ ${name} แล้ว (${(blob.size / 1e6).toFixed(1)} MB)`; }
      catch (e) { $('export-note').textContent = e && e.code === 'declined' ? 'ยกเลิกการบันทึกไฟล์ ดูคลิปด้านล่างได้ กดบันทึกใหม่ได้ตลอด' : `บันทึกไฟล์ไม่สำเร็จ (${(e && e.code) || 'ไม่ทราบสาเหตุ'}) ดูคลิปด้านล่างได้`; }
    } else $('export-note').textContent = 'หน้านี้ดาวน์โหลดไฟล์ไม่ได้ในมุมมองนี้ ดูคลิปที่บันทึกได้ด้านล่าง';
    setPlaying(false);
  }
  $('export').addEventListener('click', startRecording);

  /* ================= draft (per-browser convenience) ================= */
  const KEY = 'panaphon-studio-draft-v1';
  function saveDraft() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme: state.theme, idea: $('idea').value, script: $('script').value, cast: state.cast, scene: state.scene, look: state.look, aspect: state.aspect, length: state.length,
        chars: state.custom.chars.map((id) => ({ id, ...CH[id] })), scenes: state.custom.scenes.map((id) => ({ id, ...SCENES[id] })) }));
    } catch (e) { /* storage unavailable */ }
  }
  function loadDraft() {
    let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !THEMES.some((t) => t.id === d.theme)) return false;
    for (const c of d.chars || []) { if (!/^c_/.test(c.id)) continue; makeChar({ ...c, label: c.label }, c.id); state.custom.chars.push(c.id); }
    for (const s of d.scenes || []) { if (!/^s_/.test(s.id)) continue; makeScene({ ...s, colors: s, particles: s.particles || 'none' }, s.id); state.custom.scenes.push(s.id); }
    state.theme = d.theme; $('idea').value = d.idea || ''; $('script').value = d.script || starterScript(); state.scriptAuto = false;
    state.cast = (d.cast || []).filter((id) => CH[id]).slice(0, MAX_CAST); state.scene = SCENES[d.scene] ? d.scene : 'meadow';
    state.look = LOOKS[d.look] ? d.look : 'pastel'; state.aspect = ASPECTS[d.aspect] ? d.aspect : '9:16'; state.length = LENGTHS.includes(d.length) ? d.length : 30;
    return true;
  }

  /* ================= wire up ================= */
  const PIPE = { ideas: askIdeas, hooks: askHooks, script: askScript, qa: askQA, make: askMake };
  document.querySelectorAll('[data-ai]').forEach((b) => b.addEventListener('click', () => (PIPE[b.dataset.ai] ? PIPE[b.dataset.ai](b) : askPick(b.dataset.ai, b))));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => $(b.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' })));
  $('script').addEventListener('input', () => { state.scriptAuto = false; });
  $('idea').addEventListener('change', saveDraft);
  $('apply-script').addEventListener('click', () => showStory('mine'));
  $('undo-script').addEventListener('click', () => { if (state.prevScript == null) return; const cur = $('script').value; $('script').value = state.prevScript; state.prevScript = cur; showStory('mine'); });
  $('copy-script').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('script').value); $('copy-script').textContent = 'คัดลอกแล้ว'; } catch (e) { $('script').select(); } setTimeout(() => ($('copy-script').textContent = 'คัดลอกบท'), 1500); });
  $('play').addEventListener('click', () => setPlaying(!state.playing));
  $('seek').addEventListener('input', (e) => seekTo(+e.target.value / 1000 * state.total, false));
  (async () => {
    try { sample = window.claude ? await window.claude.use('sample') : null; } catch (e) { sample = null; }
    if (sample) { try { imagesOk = !!(await sample.limits()).images; } catch (e) { imagesOk = false; } }
    try { downloads = window.claude ? await window.claude.use('downloads') : null; } catch (e) { downloads = null; }
  })();

  buildStatic(); buildThemes(); filterThemes();
  const restored = loadDraft();
  buildMakers(); applyTheme(state.theme, restored);
  if (restored) note('story', 'กลับมาทำต่อจากครั้งก่อน (เก็บไว้ในเบราว์เซอร์นี้) เลือกธีมใหม่เพื่อเริ่มใหม่');
  document.fonts && document.fonts.ready.then(() => refresh());
  requestAnimationFrame(frame);
})();
