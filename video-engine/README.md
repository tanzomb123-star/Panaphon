# Code Video Engine

เอนจินสร้างคลิปสั้นด้วยโค้ดล้วน: ตัวละคร ฉาก และแอนิเมชันวาดด้วย Canvas เป็นฟังก์ชันของเวลา `t` (เฟรมเดิมได้ภาพเดิมเสมอ)

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|---|---|
| `engine/characters.js` | คลังตัวละคร 10 ตัว + ท่า 9 ท่า (ข้อมูลล้วน) |
| `engine/rig.js` | ตัวแปลข้อมูลตัวละครเป็นภาพ (template `critter`, `shell`) |
| `engine/styles.js` | 10 สไตล์: storybook, sunset, night, winter, desert, beach, forest, city, candy, mono |
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
npm test                                              # 24 เทสต์ (schema, rig, QA, golden frames, render)
node engine/voice.cjs --story stories/rabbit-tortoise.json
node engine/render.cjs --story stories/rabbit-tortoise.json --aspect 9:16 --style night \
  --timeline build/timeline.json --audio build/narration.mp3
node engine/sheet.cjs characters out/characters.png
UPDATE_GOLDEN=1 npm test                              # หลังตั้งใจเปลี่ยนหน้าตา ให้บันทึกภาพอ้างอิงใหม่
```
Exit code ของ render: `0` ผ่าน, `1` story ผิดรูปแบบ, `2` QA ไม่ผ่าน (ดูรายละเอียดใน `out/*.qa.json`)

## รูปแบบ story
ดู `stories/rabbit-tortoise.json` และ `stories/showcase.json`: แต่ละช็อตมี `dur`, `text` (ซับ/พากย์), `cam` = `[t, cx, cy, w, h]` (กรอบที่ต้องเห็นเสมอ),
`actors` = `{ id: { character?, x, pose, facing? } }` ค่า `x`/`pose` เป็นค่าเดียวหรือ keyframe `[[t, v], ...]`

## ข้อกำหนดเครื่อง
Node 22, ffmpeg, Playwright Chromium, ฟอนต์ไทย (Loma / Noto Sans Thai)
