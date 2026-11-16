# Code Video Server (เฟส 1)

API รับบท → หักเครดิต → เข้าคิว → เรนเดอร์ด้วย `video-engine` → ลิงก์วิดีโอแบบลงลายเซ็น
รันในเครื่องได้ทันทีโดยไม่ต้องมีบริการภายนอก และสลับไปใช้ Supabase / Redis ได้ด้วยตัวแปร env

| ส่วน | ในเครื่อง | Production |
|---|---|---|
| ฐานข้อมูล | node:sqlite (`data/app.db`) | Postgres/Supabase (ใช้ `migrations/001_init.sql` ชุดเดียวกัน, adapter ยังไม่ได้เขียน) |
| คิว | ในโปรเซส | BullMQ เมื่อมี `REDIS_URL` |
| ไฟล์ | `data/files` + URL ลงลายเซ็น HMAC | S3/R2 (adapter ยังไม่ได้เขียน) |
| ยืนยันตัวตน | header `x-user-id` | Supabase JWT (HS256) เมื่อมี `SUPABASE_JWT_SECRET` |

## รัน
```bash
cd video-engine && npm install && cd ../server && npm install
npm test            # 19 เทสต์ รวม end-to-end ที่เรนเดอร์จริง
npm start           # http://localhost:8080
```

## ลองเรียก
```bash
H='-H x-user-id:demo -H content-type:application/json'
curl $H -X POST localhost:8080/v1/dev/credits -d '{"amount":50}'
PID=$(curl -s $H -X POST localhost:8080/v1/projects -d "{\"story\": $(cat ../video-engine/stories/showcase.json)}" | jq -r .id)
JOB=$(curl -s $H -X POST localhost:8080/v1/projects/$PID/render -d '{"aspect":"9:16","style":"night"}' | jq -r .jobId)
curl -s $H localhost:8080/v1/jobs/$JOB      # status / progress / videoUrl
```

## API
| Method | Path | หมายเหตุ |
|---|---|---|
| GET | `/v1/health` | สถานะ adapter |
| GET | `/v1/catalog` | ตัวละคร ท่า สไตล์ props สัดส่วนจอ (ไม่ต้องล็อกอิน) |
| POST | `/v1/projects` `{story}` | 201 `{id, estimate:{silent,voiced}}` / 400 `{errors}` |
| GET | `/v1/projects`, `/v1/projects/:id` | ของผู้ใช้คนนั้นเท่านั้น (คนอื่นได้ 404) |
| POST | `/v1/projects/:id/render` `{aspect, style?, voice?}` | 202 `{jobId,cost}` / 402 เครดิตไม่พอ / 429 งานค้างเกิน |
| GET | `/v1/jobs`, `/v1/jobs/:id` | `status` queued→running→done/failed, `progress` 0..1, `videoUrl`, `errors` |
| GET | `/v1/me/credits` | ยอดเครดิต |
| POST | `/v1/dev/credits` `{amount}` | เฉพาะโหมด dev |
| GET | `/files/...?exp&sig` | ดาวน์โหลดวิดีโอ รองรับ Range (จำเป็นสำหรับเครื่องเล่นบน iOS/Android) |

ราคา: 1 เครดิตต่อวินาทีวิดีโอ (ปัดขึ้น) + 1 เครดิตต่อบทพากย์ 50 ตัวอักษรเมื่อขอเสียงพากย์ งานล้มเหลวคืนเครดิตเต็มจำนวนครั้งเดียว

## Docker
```bash
docker build -f server/Dockerfile -t code-video-server .   # รันจาก root ของ repo
```
