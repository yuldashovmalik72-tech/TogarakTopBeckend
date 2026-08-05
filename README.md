## Startup: barcha xizmatlar bepul

Click/Payme to'lov integratsiyasi o'chirilgan. Video-tur va boshqa premium deb atalgan xizmatlar hozir **bepul**.

# Togarak Backend

Togarak va o'quv markazlarini topish platformasi uchun backend API.

**Stack:** Node.js (ES Modules), Express 5, PostgreSQL, Prisma ORM 7 (`@prisma/adapter-pg` driver adapter orqali), JWT (access + refresh), Google OAuth, Click/Payme integratsiyasi.

> **Diqqat:** Bu loyiha ES Modules (`"type": "module"`) da yozilgan — barcha fayllarda `import`/`export` ishlatiladi, `require()` emas. Prisma 7'da ichki connection engine olib tashlangan, shuning uchun `@prisma/adapter-pg` + `pg` paketlari orqali PostgreSQL'ga ulanadi, va `DATABASE_URL` endi `schema.prisma`da emas, `prisma.config.js` faylida beriladi.

## O'rnatish

1. Paketlarni o'rnating:
   ```bash
   npm install
   ```

2. `.env.example` faylidan nusxa oling va to'ldiring:
   ```bash
   copy .env.example .env
   ```
   `DATABASE_URL` — PostgreSQL ulanish satri (lokal yoki Docker/Neon/Supabase). Bu qiymat `prisma.config.js` orqali CLI buyruqlariga, `src/config/db.js` orqali esa dastur ishlayotganda ishlatiladi.

3. Prisma orqali bazani yarating:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
   (Bu buyruqlar avtomatik ravishda `prisma.config.js` faylini o'qiydi va undagi `datasource.url`dan foydalanadi.)

4. Birinchi ADMIN foydalanuvchini yarating (moderatsiya uchun shart):
   - Avval oddiy `/api/auth/register` orqali ro'yxatdan o'ting.
   - Keyin bazada shu userning `role` maydonini `ADMIN` ga o'zgartiring:
     ```bash
     npx prisma studio
     ```
     (Prisma Studio ochiladi — `users` jadvalida kerakli qatorni tanlab, `role`ni `ADMIN` qiling.)

5. Serverni ishga tushiring:
   ```bash
   npm run dev
   ```
   Server: `http://localhost:5000` · Health: `http://localhost:5000/health` · **Swagger:** `http://localhost:5000/api-docs`

## Papka tuzilishi

```
src/
├── config/       # env, prisma client (adapter bilan)
├── controllers/  # biznes logika
├── middleware/   # auth, error, upload, validate, paymeAuth
├── routes/       # API endpointlar
├── services/     # token, google auth, click, payme
└── utils/        # ApiError, ApiResponse, asyncHandler
prisma/
└── schema.prisma # ma'lumotlar bazasi modeli
prisma.config.js  # Prisma 7 CLI konfiguratsiyasi (DATABASE_URL shu yerda)
```

## Muhim: bu loyiha ES Modules'da yozilgan

`package.json`da `"type": "module"` o'rnatilgan. Bu shuni anglatadi:
- Barcha faylda `require()` o'rniga `import`, `module.exports` o'rniga `export` ishlatiladi.
- Har bir lokal import **`.js` kengaytmasi bilan yozilishi shart** (masalan `import prisma from "../config/db.js"`, `"../config/db"` emas) — bu Node.js ESM qoidasi, ixtiyoriy emas.
- Yangi fayl qo'shsangiz, xuddi shu uslubda yozing.

## Ma'lumotlar modeli (qisqacha)

```
User ──┬── CourseCenter (masalan "Registon LC")
       │        │
       │        └── Circle[] (yo'nalish: "Ingliz tili", "Rus tili"...)
       │
       └── Circle (UY/ONLINE turi uchun to'g'ridan-to'g'ri)
                │
                ├── Group[] (guruh: o'qituvchi, jadval, guruh hajmi)
                │      └── Certificate[] (o'qituvchi sertifikati, admin tasdiqlaydi)
                │
                └── Result[] (o'quvchi natijalari: IELTS, CEFR..., admin tasdiqlaydi)

User ── Payment[] (Click/Payme/Uzum/Alif/Paynet orqali to'lovlar)
```

**Muhim qoida:** `type=UY` yoki `ONLINE` bo'lgan Circle'da faqat **1 ta** Group bo'lishi mumkin. `type=KURS` bo'lganda (masalan Registon LC ichidagi "Ingliz tili") **istalgancha** Group qo'shish mumkin — har biri o'z o'qituvchisi, jadvali, guruh hajmi bilan.

## Asosiy endpointlar

### Auth
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/auth/register` | Ro'yxatdan o'tish (ism, familiya, yosh, email, parol) |
| POST | `/api/auth/login` | Kirish |
| POST | `/api/auth/google` | Google orqali kirish (`{ idToken }`) |
| POST | `/api/auth/refresh` | Access tokenni yangilash |
| POST | `/api/auth/logout` | Chiqish |
| GET | `/api/auth/me` | Joriy foydalanuvchi |
| PATCH | `/api/auth/me` | Profilni yangilash |
| PATCH | `/api/auth/change-password` | Parolni almashtirish |

### Togaraklar (Circle / Yo'nalish)
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/circles?query=ingliz&type=KURS` | Qidiruv/filtr — faqat `ACTIVE` chiqadi |
| GET | `/api/circles/mine` | Mening togaraklarim |
| GET | `/api/circles/pending` | **ADMIN**: moderatsiya navbati |
| GET | `/api/circles/:id` | To'liq ma'lumot (guruhlar, natijalar bilan) |
| GET | `/api/circles/:id/stats` | Bepul asosiy statistika (egasi/admin) |
| POST | `/api/circles` | Yaratish (multipart: `images[]` max 2) |
| PATCH | `/api/circles/:id` | Tahrirlash (qayta moderatsiyaga tushadi) |
| DELETE | `/api/circles/:id` | O'chirish |
| PATCH | `/api/circles/:id/status` | **ADMIN**: `ACTIVE/INACTIVE/REJECTED/ARCHIVED` qilish |
| POST | `/api/circles/:id/video-tour` | **Pullik**: holat videosi (UY/ONLINE) |
| POST | `/api/circles/:circleId/groups` | Guruh qo'shish |
| POST | `/api/circles/:circleId/results` | O'quvchi natijasi qo'shish |

### Guruhlar
| Metod | Yo'l | Tavsif |
|---|---|---|
| PATCH | `/api/groups/:id` | Guruhni tahrirlash |
| DELETE | `/api/groups/:id` | Guruhni o'chirish |
| POST | `/api/groups/:groupId/certificates` | O'qituvchi sertifikati yuklash (`title` + `image`) |

### Sertifikatlar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/certificates/pending` | **ADMIN**: tasdiqlanmagan sertifikatlar |
| PATCH | `/api/certificates/:id/verify` | **ADMIN**: tasdiqlash/bekor qilish |
| DELETE | `/api/certificates/:id` | O'chirish |

### Natijalar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/results/pending` | **ADMIN**: tasdiqlanmagan natijalar |
| PATCH | `/api/results/:id/verify` | **ADMIN**: tasdiqlash/bekor qilish |
| DELETE | `/api/results/:id` | O'chirish |

### O'quv markazlari (Kurs turi uchun)
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/course-centers` | Markaz yaratish (masalan "Registon LC") |
| GET | `/api/course-centers/:id` | Markaz va uning faol yo'nalishlari |
| GET | `/api/course-centers/mine` | Mening markazlarim |
| GET | `/api/course-centers/:centerId/circles` | Markazdagi barcha yo'nalishlar |
| PATCH | `/api/course-centers/:id` | Tahrirlash |
| DELETE | `/api/course-centers/:id` | O'chirish (barcha yo'nalishlar bilan birga) |
| POST | `/api/course-centers/:id/video-tour` | **Pullik**: markazning umumiy videosi |

### To'lovlar
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/api/payments/initiate` | To'lov boshlash (`featureType`, `provider`, `targetCircleId`/`targetCourseCenterId`) |
| GET | `/api/payments/mine` | Mening to'lovlarim |
| GET | `/api/payments/:id` | To'lov holati |
| POST | `/api/payments/click/prepare` | Click webhook (imzo tekshiriladi) |
| POST | `/api/payments/click/complete` | Click webhook (imzo tekshiriladi) |
| POST | `/api/payments/payme` | Payme JSON-RPC webhook (`Authorization: Basic` tekshiriladi) |

## Pullik xizmatlar (yaratuvchi uchun)

- `VIDEO_TOUR` — o'quv xonalarini to'liq ko'rsatuvchi video (Circle yoki CourseCenter darajasida)
- `ANALYTICS` — kengaytirilgan statistika (hozircha faqat narx belgilangan, controller keyingi bosqichda)
- `PROMO` — qidiruvda yuqorida chiqish / boost (hozircha faqat narx belgilangan, controller keyingi bosqichda)

Narxlar `src/controllers/payment.controller.js` ichidagi `FEATURE_PRICES`da belgilangan.

## Moderatsiya oqimi

1. Foydalanuvchi Circle yaratadi → status avtomatik `PENDING`.
2. Foydalanuvchi kamida 1 ta Group qo'shadi.
3. Admin `GET /api/circles/pending` orqali navbatni ko'radi.
4. Admin `PATCH /api/circles/:id/status` bilan `ACTIVE` qiladi (guruh bo'lmasa xatolik qaytadi).
5. Shundan keyingina Circle `GET /api/circles` qidiruvida chiqadi.

Xuddi shunday oqim Certificate va Result uchun ham bor — ular yuklanganda `verified=false`, admin `verify` endpointi orqali tasdiqlagach foydalanuvchiga "✅ Tasdiqlangan" sifatida ko'rsatiladi.

## Xavfsizlik eslatmalari

- **Payme webhook**: `Authorization: Basic base64(Paycom:SECRET_KEY)` header orqali tekshiriladi (`middleware/paymeAuth.middleware.js`). `.env`dagi `PAYME_SECRET_KEY` to'ldirilmasa, webhook hech qanday so'rovni qabul qilmaydi — bu ataylab shunday, chunki kalitsiz webhook xavfsiz emas.
- **Click webhook**: MD5 imzo (`sign_string`) orqali tekshiriladi.
- Production muhitida fayllarni lokal diskda emas, S3/Cloudinary kabi bulutli xotirada saqlash tavsiya etiladi (`upload.middleware.js` ichida eslatma bor).

## Keyingi qadamlar (tavsiya, loyiha o'sgach)

1. `ANALYTICS` va `PROMO` uchun to'liq controller mantiqini yozish (masalan `getCircleStats`ni ANALYTICS to'lovi bilan bog'lash).
2. Freemium limit: bepul rejada 1 ta yo'nalish, pullik obunada cheksiz.
3. Real Click/Payme merchant kabinetidan `.env` qiymatlarini olib sandbox muhitida test qilish.
4. Email tasdiqlash (`isVerified`) oqimini qo'shish.
5. UZUM/ALIF/PAYNET uchun shartnoma tuzilgach, `payment.controller.js`dagi `initiate`ga real integratsiya qo'shish.


## Swagger (API hujjatlari)

Server ishga tushgach brauzerda oching:

```
http://localhost:5000/api-docs
```

1. `POST /api/auth/login` yoki `register` orqali `accessToken` oling  
2. Yuqoridagi **Authorize** tugmasini bosing  
3. `Bearer <token>` kiriting (yoki faqat token)  
4. Himoyalangan endpointlarni **Try it out** bilan sinab ko'ring  

Raw JSON: `http://localhost:5000/api-docs.json`

## Yangilanishlar (v1.1)

### Auth
| Metod | Yo'l | Tavsif |
|---|---|---|
| PATCH | `/api/auth/me` | Profilni yangilash (firstName, lastName, age, avatarUrl) |
| PATCH | `/api/auth/change-password` | Parolni almashtirish (barcha sessiyalar bekor qilinadi) |
| POST | `/api/auth/verify-email` | Email tasdiqlash (`{ token }`) |
| POST | `/api/auth/resend-verification` | Tasdiqlash xatini qayta yuborish |
| GET | `/api/auth/users` | **ADMIN**: foydalanuvchilar ro'yxati |
| PATCH | `/api/auth/users/:id/role` | **ADMIN**: rol o'zgartirish (USER/CREATOR/ADMIN) |

### Qidiruv (kuchaytirilgan)
`GET /api/circles` query parametrlari:
- `sort`: `newest` | `oldest` | `price_asc` | `price_desc` | `popular` | `name` | `nearest`
- `lat`, `lng`, `radiusKm` — geo filtr va "yaqinroq" tartiblash
- `minPrice`, `maxPrice`
- `query` endi description maydonini ham qamrab oladi

### Soft-delete
- `DELETE /api/circles/:id` va `DELETE /api/course-centers/:id` — hard delete o'rniga **ARCHIVED + deletedAt**
- `POST /api/circles/:id/restore` va `POST /api/course-centers/:id/restore` — qayta tiklash

### Rasmlar (update)
- `PATCH /api/circles/:id` va `PATCH /api/course-centers/:id` — `images[]` (yangi) + `removeImages` (o'chiriladigan URL lar)

### Statistika
- `viewCount` / `clickCount` Circle modelida
- Detail ochilganda avtomatik view (24 soat ichida bir marta)
- `POST /api/circles/:id/click` — kontakt bosilganda
- `GET /api/circles/:id/stats` — 7/30 kunlik ko'rishlar

### Bildirishnomalar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/notifications` | Mening bildirishnomalarim |
| POST | `/api/notifications/read-all` | Hammasini o'qilgan qilish |
| PATCH | `/api/notifications/:id/read` | Bitta o'qilgan |
| DELETE | `/api/notifications/:id` | O'chirish |

Moderatsiya (ACTIVE/REJECTED), sertifikat/natija tasdiqlashda avtomatik bildirishnoma + email (SMTP bo'lsa).

### Validatsiya
Circle, Group, Result, CourseCenter create endpointlarida express-validator qoidalari.

### Upload / Email
- `UPLOAD_PROVIDER=local|s3` (S3 env tayyor, integratsiya keyingi bosqich)
- SMTP bo'sh bo'lsa email konsolga yoziladi

### Test
```bash
npm run test:smoke
```

### Migratsiya
Yangi maydonlar uchun:
```bash
npx prisma migrate dev --name enhance_v1_1
npx prisma generate
```
#   T o g a r a k T o p B e c k e n d  
 