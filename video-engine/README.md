# Code Video Engine

เอนจินสร้างคลิปสั้นด้วยโค้ดล้วน: ตัวละคร ฉาก และแอนิเมชันวาดด้วย Canvas เป็นฟังก์ชันของเวลา `t` (เฟรมเดิมได้ภาพเดิมเสมอ)

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|---|---|
| `engine/characters.js` | ตัวละคร 20 ตัว (สัตว์ 10 + คน chibi 10: narrator, boy, girl, dad, mom, grandma, teacher, doctor, vendor, detective) + ท่า 9 ท่า (ข้อมูลล้วน) |
| `engine/rig.js` | ตัวแปลข้อมูลตัวละครเป็นภาพ (template `critter`, `shell`, `human`) วาดผ่าน pen ของสไตล์ |
| `engine/looks.js` | **style** = วิธีวาด 10 แบบ: pastel, paper, chalk, comic, pixel, neon, watercolor, thai, minimal, noir |
| `engine/scenes.js` | **scene** = สถานที่/เวลา 8 แบบ: meadow, sunset, night, winter, desert, beach, forest, city |
| `engine/props.js` | ฉากประกอบ: tree, finish, rock, sign, house |
| `engine/stage.js` | วาดฉาก กล้อง ซับไตเติลไทย และ `qa(t)` |
| `engine/schema.cjs` | ตรวจไฟล์ story ก่อนเรนเดอร์ (`node engine/schema.cjs stories/x.json`) |
| `engine/qa.cjs` | ตรวจจอดำ ภาพค้าง เสียงยาวเกินช็อต |
| `engine/render.cjs` | ตรวจ → QA → เรนเดอร์ขนานหลาย worker → รวมไฟล์ + เสียง |
| `engine/voice.cjs` | พากย์ไทย ElevenLabs + ถอดเสียงกลับมาตรวจ |
| `engine/sheet.cjs` | ภาพรวมตัวละคร / สไตล์ |

## ใช้งาน
```bash
npm install
npm test                                              # 28 เทสต์ (schema, rig, looks, QA, golden frames, render)
node engine/voice.cjs --story stories/rabbit-tortoise.json
node engine/render.cjs --story stories/people.json --aspect 9:16 --style chalk --scene night \
  --timeline build/timeline.json --audio build/narration.mp3
node engine/sheet.cjs characters out/characters.png [look]
node engine/sheet.cjs looks out/looks.png stories/people.json 6
UPDATE_GOLDEN=1 npm test                              # หลังตั้งใจเปลี่ยนหน้าตา ให้บันทึกภาพอ้างอิงใหม่
```
Exit code ของ render: `0` ผ่าน, `1` story ผิดรูปแบบ, `2` QA ไม่ผ่าน (ดูรายละเอียดใน `out/*.qa.json`)

## รูปแบบ story
`scene` (ที่ไหน/เมื่อไร) และ `style` (วาดแบบไหน) เลือกแยกกันได้ทุกคู่ 8 × 10 = 80 แบบ ตั้งในไฟล์ story หรือส่ง `--scene` / `--style` ตอนเรนเดอร์
ดู `stories/rabbit-tortoise.json` และ `stories/showcase.json`: แต่ละช็อตมี `dur`, `text` (ซับ/พากย์), `cam` = `[t, cx, cy, w, h]` (กรอบที่ต้องเห็นเสมอ),
`actors` = `{ id: { character?, x, pose, facing? } }` ค่า `x`/`pose` เป็นค่าเดียวหรือ keyframe `[[t, v], ...]`

## ข้อกำหนดเครื่อง
Node 22, ffmpeg, Playwright Chromium, ฟอนต์ไทย (Loma / Noto Sans Thai)
