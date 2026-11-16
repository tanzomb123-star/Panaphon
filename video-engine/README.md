# Code Video Engine

เอนจินสร้างคลิปสั้นด้วยโค้ดล้วน (ถอดแนวคิดจากโฆษณา "OOSKILL Video Engine" แล้วเขียนเองใหม่ทั้งหมด)

| ฟีเจอร์ในโฆษณา | วิธีทำในโปรเจกต์นี้ |
|---|---|
| วาดด้วยโค้ดทั้งหมด | `engine/stage.js` วาดตัวละคร/ฉากด้วย Canvas 2D เป็นฟังก์ชันของเวลา `t` (เฟรมเดิมได้ผลเดิมเสมอ → ไม่กระพริบ ตัวละครหน้าเดิมทุกช็อต) |
| หลายสไตล์ | `STYLES` ใน `stage.js` (storybook / sunset / night) สลับด้วย `--style` |
| ตัวละครไม่โดนตัดขอบ | ทุกช็อตกำหนดกล่อง `cam` ที่ต้องมองเห็น กล้องซูมให้พอดีทุกสัดส่วนจอ + `window.qa(t)` ตรวจ bounding box ทุก 1/4 วินาที (render จบด้วย exit code 2 ถ้าตัดขอบ) |
| 9:16 / 16:9 / 1:1 | `--aspect` |
| เสียงพากย์ไทย | `engine/voice.cjs` ElevenLabs TTS ต่อช็อต ความยาวช็อตปรับตามเสียงอัตโนมัติ |
| ฟังเสียงกลับมาตรวจ | `voice.cjs` ถอดเสียงด้วย scribe_v1 แล้วให้คะแนนความเหมือนต่อช็อต (ต้องใช้คีย์ที่มีสิทธิ์ speech_to_text) |
| หัวข้อเดียว → หาข้อมูล+เขียนบท | ยังไม่ทำ: เป็นขั้น LLM ที่สร้าง `stories/*.json` (ดูรูปแบบใน `stories/rabbit-tortoise.json`) |
| ลอกสไตล์คลิปอื่นพร้อมคะแนนความเหมือน | ยังไม่ทำ |

## ใช้งาน
```bash
node engine/voice.cjs --story stories/rabbit-tortoise.json            # สร้าง build/narration.mp3 + timeline.json
node engine/render.cjs --aspect 9:16 --short 720 --fps 24 \
  --timeline build/timeline.json --audio build/narration.mp3 --out out/clip.mp4
```
ต้องมี Node 22, ffmpeg, playwright (chromium) และฟอนต์ไทย (Loma/Noto Sans Thai).
เรนเดอร์แบบเงียบได้โดยไม่ต้องใช้ `voice.cjs`.
