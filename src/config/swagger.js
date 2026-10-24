/**
 * OpenAPI 3.0 (Swagger) hujjati — /api-docs da ko'rinadi
 */
const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Velox API",
    version: "1.1.0",
    description:
      "Velox - to'garak va o'quv markazlarini topish platformasi backend API.\n\n" +
      "**Autentifikatsiya:** `Authorize` tugmasini bosib `Bearer <accessToken>` kiriting.\n" +
      "Login/register dan keyin `accessToken` olinadi.",
    contact: { name: "Velox" },
  },
  servers: [
    { url: "http://localhost:5000", description: "Local development" },
  ],
  tags: [
    { name: "Health", description: "Server holati" },
    { name: "Auth", description: "Ro'yxatdan o'tish, kirish, profil" },
    { name: "Circles", description: "To'garaklar / yo'nalishlar" },
    { name: "Groups", description: "Guruhlar" },
    { name: "Certificates", description: "O'qituvchi sertifikatlari" },
    { name: "Results", description: "O'quvchi natijalari" },
    { name: "Course Centers", description: "O'quv markazlari" },
    { name: "Payments", description: "O'chirilgan — startup bepul" },
    { name: "Notifications", description: "Bildirishnomalar" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token: `Bearer eyJhbGci...`",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Muvaffaqiyatli" },
          data: {},
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
      RegisterBody: {
        type: "object",
        required: ["firstName", "lastName", "email", "password"],
        properties: {
          firstName: { type: "string", example: "Malik" },
          lastName: { type: "string", example: "Yuldashov" },
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
          age: { type: "integer", example: 22 },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      CircleCreate: {
        type: "object",
        required: ["name", "category", "direction", "type", "description", "tavsif", "priceType"],
        properties: {
          name: { type: "string", example: "Ingliz tili Beginner" },
          category: { type: "string", example: "Til o'rganish" },
          direction: { type: "string", example: "Ingliz tili" },
          type: { type: "string", enum: ["UY", "ONLINE", "KURS"] },
          description: { type: "string" },
          tavsif: { type: "string" },
          priceType: { type: "string", enum: ["FIXED", "NEGOTIABLE", "FREE"] },
          priceAmount: { type: "number", example: 500000 },
          currency: { type: "string", enum: ["UZS", "USD"] },
          pricePeriod: { type: "string", enum: ["MONTHLY", "WEEKLY", "ONE_TIME", "PER_LESSON"] },
          address: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
          ageGroupMin: { type: "integer" },
          ageGroupMax: { type: "integer" },
          contactPhone: { type: "string" },
          contactTelegram: { type: "string" },
          courseCenterId: { type: "string", format: "uuid", description: "Faqat type=KURS uchun" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Server ishlayotganini tekshirish",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "OK" },
                    time: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ========== AUTH ==========
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Ro'yxatdan o'tish",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
        },
        responses: {
          201: { description: "Yaratildi + accessToken" },
          409: { description: "Email band", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Kirish",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
        },
        responses: {
          200: { description: "accessToken + user" },
          401: { description: "Noto'g'ri login/parol" },
        },
      },
    },
    "/api/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Google orqali kirish",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: { idToken: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Access tokenni yangilash (cookie orqali refreshToken)",
        responses: { 200: { description: "Yangi accessToken" } },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Chiqish",
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Joriy foydalanuvchi",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "User" }, 401: { description: "Token yo'q" } },
      },
      patch: {
        tags: ["Auth"],
        summary: "Profilni yangilash",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  age: { type: "integer", nullable: true },
                  avatarUrl: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Yangilandi" } },
      },
    },
    "/api/auth/change-password": {
      patch: {
        tags: ["Auth"],
        summary: "Parolni almashtirish",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Parol o'zgardi, qayta kiring" } },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Email tasdiqlash",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: { token: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Tasdiqlandi" } },
      },
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Tasdiqlash xatini qayta yuborish",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Yuborildi" } },
      },
    },
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "Foydalanuvchilar ro'yxati (ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "query", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Ro'yxat" }, 403: { description: "Faqat ADMIN" } },
      },
    },
    "/api/auth/users/{id}/role": {
      patch: {
        tags: ["Auth"],
        summary: "Rolni o'zgartirish (ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: { role: { type: "string", enum: ["USER", "CREATOR", "ADMIN"] } },
              },
            },
          },
        },
        responses: { 200: { description: "Rol yangilandi" } },
      },
    },

    // ========== CIRCLES ==========
    "/api/circles": {
      get: {
        tags: ["Circles"],
        summary: "Togaraklarni qidirish (faqat ACTIVE)",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" }, description: "Qidiruv matni" },
          { name: "type", in: "query", schema: { type: "string", enum: ["UY", "ONLINE", "KURS"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "minAge", in: "query", schema: { type: "integer" } },
          { name: "maxAge", in: "query", schema: { type: "integer" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "price_asc", "price_desc", "popular", "name", "nearest"],
              default: "newest",
            },
          },
          { name: "lat", in: "query", schema: { type: "number" }, description: "Geo: kenglik" },
          { name: "lng", in: "query", schema: { type: "number" }, description: "Geo: uzunlik" },
          { name: "radiusKm", in: "query", schema: { type: "number" }, description: "Radius (km)" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "items + pagination" } },
      },
      post: {
        tags: ["Circles"],
        summary: "Togarak yaratish (multipart: images max 2)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/CircleCreate" },
                  {
                    type: "object",
                    properties: {
                      images: {
                        type: "array",
                        items: { type: "string", format: "binary" },
                        maxItems: 2,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: { 201: { description: "PENDING holatda yaratildi" } },
      },
    },
    "/api/circles/mine": {
      get: {
        tags: ["Circles"],
        summary: "Mening togaraklarim",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "includeDeleted", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: { 200: { description: "Ro'yxat" } },
      },
    },
    "/api/circles/pending": {
      get: {
        tags: ["Circles"],
        summary: "Moderatsiya navbati (ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "PENDING togaraklar" } },
      },
    },
    "/api/circles/{id}": {
      get: {
        tags: ["Circles"],
        summary: "Togarak tafsiloti (view hisoblanadi)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "To'liq ma'lumot" }, 404: { description: "Topilmadi" } },
      },
      patch: {
        tags: ["Circles"],
        summary: "Tahrirlash (+ rasmlar: images, removeImages)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  removeImages: { type: "string", description: 'JSON array yoki bitta URL' },
                  images: { type: "array", items: { type: "string", format: "binary" } },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Yangilandi" } },
      },
      delete: {
        tags: ["Circles"],
        summary: "Soft-delete (ARCHIVED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Arxivlandi" } },
      },
    },
    "/api/circles/{id}/restore": {
      post: {
        tags: ["Circles"],
        summary: "Arxivdan qayta tiklash",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "PENDING holatga qaytdi" } },
      },
    },
    "/api/circles/{id}/status": {
      patch: {
        tags: ["Circles"],
        summary: "Status o'zgartirish (ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "INACTIVE", "PENDING", "REJECTED", "ARCHIVED"] },
                  reason: { type: "string", description: "Rad etish sababi (ixtiyoriy)" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Status yangilandi" } },
      },
    },
    "/api/circles/{id}/stats": {
      get: {
        tags: ["Circles"],
        summary: "Statistika (egasi/admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "viewCount, clickCount, 7/30 kun..." } },
      },
    },
    "/api/circles/{id}/click": {
      post: {
        tags: ["Circles"],
        summary: "Kontakt/click hisoblash",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Qayd etildi" } },
      },
    },
    "/api/circles/{id}/video-tour": {
      post: {
        tags: ["Circles"],
        summary: "Video-tour yuklash (PULLIK)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["video"],
                properties: { video: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: { 200: { description: "Yuklandi" }, 200: { description: "Bepul yuklash" } },
      },
    },
    "/api/circles/{circleId}/groups": {
      post: {
        tags: ["Groups"],
        summary: "Guruh qo'shish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "circleId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Beginner-A" },
                  teacherName: { type: "string" },
                  teacherBio: { type: "string" },
                  teacherAvatar: { type: "string" },
                  schedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "string" },
                        start: { type: "string" },
                        end: { type: "string" },
                      },
                    },
                  },
                  maxStudents: { type: "integer" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Guruh qo'shildi" } },
      },
    },
    "/api/circles/{circleId}/results": {
      post: {
        tags: ["Results"],
        summary: "Natija qo'shish (rasm majburiy)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "circleId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "type", "image"],
                properties: {
                  title: { type: "string", example: "IELTS 7.5" },
                  type: { type: "string", example: "IELTS" },
                  studentName: { type: "string" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Natija qo'shildi (verified=false)" } },
      },
    },

    // ========== GROUPS ==========
    "/api/groups/{id}": {
      patch: {
        tags: ["Groups"],
        summary: "Guruhni tahrirlash",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Yangilandi" } },
      },
      delete: {
        tags: ["Groups"],
        summary: "Guruhni o'chirish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "O'chirildi" } },
      },
    },
    "/api/groups/{groupId}/certificates": {
      post: {
        tags: ["Certificates"],
        summary: "Sertifikat yuklash",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "groupId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "image"],
                properties: {
                  title: { type: "string", example: "IELTS 8.0" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Yuklandi" } },
      },
    },

    // ========== CERTIFICATES ==========
    "/api/certificates/pending": {
      get: {
        tags: ["Certificates"],
        summary: "Tasdiqlanmagan sertifikatlar (ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Ro'yxat" } },
      },
    },
    "/api/certificates/{id}/verify": {
      patch: {
        tags: ["Certificates"],
        summary: "Sertifikatni tasdiqlash (ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { verified: { type: "boolean", default: true } },
              },
            },
          },
        },
        responses: { 200: { description: "Tasdiqlandi" } },
      },
    },
    "/api/certificates/{id}": {
      delete: {
        tags: ["Certificates"],
        summary: "Sertifikatni o'chirish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "O'chirildi" } },
      },
    },

    // ========== RESULTS ==========
    "/api/results/pending": {
      get: {
        tags: ["Results"],
        summary: "Tasdiqlanmagan natijalar (ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Ro'yxat" } },
      },
    },
    "/api/results/{id}/verify": {
      patch: {
        tags: ["Results"],
        summary: "Natijani tasdiqlash (ADMIN)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { verified: { type: "boolean", default: true } },
              },
            },
          },
        },
        responses: { 200: { description: "Tasdiqlandi" } },
      },
    },
    "/api/results/{id}": {
      delete: {
        tags: ["Results"],
        summary: "Natijani o'chirish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "O'chirildi" } },
      },
    },

    // ========== COURSE CENTERS ==========
    "/api/course-centers": {
      post: {
        tags: ["Course Centers"],
        summary: "O'quv markazi yaratish",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Registon LC" },
                  description: { type: "string" },
                  address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  contactPhone: { type: "string" },
                  contactTelegram: { type: "string" },
                  images: { type: "array", items: { type: "string", format: "binary" }, maxItems: 2 },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Yaratildi" } },
      },
    },
    "/api/course-centers/mine": {
      get: {
        tags: ["Course Centers"],
        summary: "Mening markazlarim",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Ro'yxat" } },
      },
    },
    "/api/course-centers/{id}": {
      get: {
        tags: ["Course Centers"],
        summary: "Markaz tafsiloti",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Markaz + ACTIVE circles" } },
      },
      patch: {
        tags: ["Course Centers"],
        summary: "Markazni tahrirlash",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Yangilandi" } },
      },
      delete: {
        tags: ["Course Centers"],
        summary: "Soft-delete markaz",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Arxivlandi" } },
      },
    },
    "/api/course-centers/{id}/restore": {
      post: {
        tags: ["Course Centers"],
        summary: "Markazni qayta tiklash",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Tiklandi" } },
      },
    },
    "/api/course-centers/{centerId}/circles": {
      get: {
        tags: ["Course Centers"],
        summary: "Markazdagi ACTIVE yo'nalishlar",
        parameters: [{ name: "centerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Circles ro'yxati" } },
      },
    },
    "/api/course-centers/{id}/video-tour": {
      post: {
        tags: ["Course Centers"],
        summary: "Markaz video-tour (PULLIK)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["video"],
                properties: { video: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: { 200: { description: "Yuklandi" } },
      },
    },

    // ========== PAYMENTS ==========
    "/api/payments/initiate": {
      post: {
        tags: ["Payments"],
        summary: "To'lov boshlash",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["featureType", "provider"],
                properties: {
                  featureType: { type: "string", enum: ["VIDEO_TOUR", "ANALYTICS", "PROMO"] },
                  provider: { type: "string", enum: ["CLICK", "PAYME", "UZUM", "ALIF", "PAYNET"] },
                  targetCircleId: { type: "string", format: "uuid" },
                  targetCourseCenterId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "payment + paymentUrl" } },
      },
    },
    "/api/payments/mine": {
      get: {
        tags: ["Payments"],
        summary: "Mening to'lovlarim",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Ro'yxat" } },
      },
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "To'lov holati",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Payment" } },
      },
    },
    "/api/payments/click/prepare": {
      post: {
        tags: ["Payments"],
        summary: "Click webhook Prepare",
        responses: { 200: { description: "Click response" } },
      },
    },
    "/api/payments/click/complete": {
      post: {
        tags: ["Payments"],
        summary: "Click webhook Complete",
        responses: { 200: { description: "Click response" } },
      },
    },
    "/api/payments/payme": {
      post: {
        tags: ["Payments"],
        summary: "Payme JSON-RPC webhook",
        responses: { 200: { description: "JSON-RPC response" } },
      },
    },

    // ========== NOTIFICATIONS ==========
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Mening bildirishnomalarim",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "unreadOnly", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: { 200: { description: "items + unreadCount + pagination" } },
      },
    },
    "/api/notifications/read-all": {
      post: {
        tags: ["Notifications"],
        summary: "Hammasini o'qilgan qilish",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Bitta bildirishnomani o'qilgan qilish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Bildirishnomani o'chirish",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "O'chirildi" } },
      },
    },
  },
};

export default swaggerDocument;
