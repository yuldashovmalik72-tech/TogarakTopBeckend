import crypto from "crypto";
import prisma from "../config/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notifyCircleModeration } from "../services/notification.service.js";
import { uploadToCloud } from "../services/cloudUpload.service.js";

// FormData bo'sh satr yuboradi — "" degani maydon tozalanadi (null)
function optionalBool(v) {
  if (v === undefined || v === null || v === "") return null;
  return v === true || v === "true" || v === "True";
}

const publicListSelect = {
  id: true,
  name: true,
  category: true,
  direction: true,
  type: true,
  images: true,
  priceType: true,
  priceAmount: true,
  currency: true,
  pricePeriod: true,
  address: true,
  latitude: true,
  longitude: true,
  status: true,
  viewCount: true,
  createdAt: true,
  courseCenter: { select: { id: true, name: true, images: true } },
  _count: { select: { groups: true, reviews: true } },
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const listCircles = asyncHandler(async (req, res) => {
  const {
    query,
    type,
    category,
    minAge,
    maxAge,
    sort = "newest",
    lat,
    lng,
    radiusKm,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
  } = req.query;

  const where = { status: "ACTIVE", deletedAt: null };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { direction: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (category) where.category = { equals: category, mode: "insensitive" };
  if (minAge) where.ageGroupMax = { gte: Number(minAge) };
  if (maxAge) where.ageGroupMin = { lte: Number(maxAge) };
  if (minPrice !== undefined) where.priceAmount = { ...(where.priceAmount || {}), gte: Number(minPrice) };
  if (maxPrice !== undefined) where.priceAmount = { ...(where.priceAmount || {}), lte: Number(maxPrice) };

  const userLat = lat !== undefined ? Number(lat) : null;
  const userLng = lng !== undefined ? Number(lng) : null;
  const radius = radiusKm !== undefined ? Number(radiusKm) : null;
  const useGeo = userLat !== null && userLng !== null && !Number.isNaN(userLat) && !Number.isNaN(userLng);

  if (useGeo && radius) {
    const deg = radius / 111;
    where.latitude = { gte: userLat - deg, lte: userLat + deg };
    where.longitude = { gte: userLng - deg, lte: userLng + deg };
  }

  const orderByMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    price_asc: { priceAmount: "asc" },
    price_desc: { priceAmount: "desc" },
    popular: { viewCount: "desc" },
    name: { name: "asc" },
    rating: { createdAt: "desc" },
  };
  const orderBy = orderByMap[sort] || orderByMap.newest;

  const take = Math.min(Number(limit) || 20, 50);
  const skip = (Number(page) - 1) * take;
  const fetchTake = useGeo && (sort === "nearest" || radius) ? Math.min(take * 5, 200) : take;
  const fetchSkip = useGeo && (sort === "nearest" || radius) ? 0 : skip;

  const [rawItems, total] = await Promise.all([
    prisma.circle.findMany({
      where,
      select: publicListSelect,
      skip: fetchSkip,
      take: fetchTake,
      orderBy: sort === "nearest" ? { createdAt: "desc" } : orderBy,
    }),
    prisma.circle.count({ where }),
  ]);

  let items = rawItems;
  let effectiveTotal = total;

  if (useGeo) {
    items = rawItems
      .map((c) => {
        if (c.latitude == null || c.longitude == null) return { ...c, distanceKm: null };
        const distanceKm = haversineKm(userLat, userLng, c.latitude, c.longitude);
        return { ...c, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter((c) => (radius ? c.distanceKm !== null && c.distanceKm <= radius : true));

    if (sort === "nearest") {
      items.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }
    effectiveTotal = items.length;
    items = items.slice(skip, skip + take);
  }

  const circleIds = items.map((c) => c.id);
  const reviewsByCircle = circleIds.length
    ? await prisma.review.groupBy({
        by: ["circleId"],
        where: { circleId: { in: circleIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];
  const ratingMap = new Map(reviewsByCircle.map((r) => [r.circleId, { avg: Math.round(r._avg.rating * 10) / 10, count: r._count.rating }]));

  items = items.map((c) => ({
    ...c,
    avgRating: ratingMap.get(c.id)?.avg ?? 0,
    reviewCount: ratingMap.get(c.id)?.count ?? 0,
  }));

  if (sort === "rating") {
    items.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    effectiveTotal = items.length;
    items = items.slice(skip, skip + take);
  }

  res.json(
    new ApiResponse(200, {
      items,
      pagination: {
        page: Number(page),
        limit: take,
        total: effectiveTotal,
        pages: Math.ceil(effectiveTotal / take) || 1,
      },
    })
  );
});

const getCircleById = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      groups: { include: { certificates: true }, orderBy: { createdAt: "asc" } },
      results: { where: { verified: true }, orderBy: { createdAt: "desc" } },
      courseCenter: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");

  const isOwnerOrAdmin = req.user && (req.user.id === circle.ownerId || req.user.role === "ADMIN");
  if (!isOwnerOrAdmin && !["ACTIVE", "INACTIVE"].includes(circle.status)) {
    throw ApiError.notFound("Togarak topilmadi");
  }

  const isOwner = req.user && req.user.id === circle.ownerId;
  if (!isOwner) {
    const ip = req.ip || req.headers["x-forwarded-for"] || "";
    const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 32);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orClause = [{ ipHash }];
    if (req.user) orClause.push({ userId: req.user.id });

    const existing = await prisma.circleView.findFirst({
      where: { circleId: circle.id, createdAt: { gte: since }, OR: orClause },
    });

    if (!existing) {
      await prisma.$transaction([
        prisma.circleView.create({
          data: { circleId: circle.id, userId: req.user?.id || null, ipHash },
        }),
        prisma.circle.update({ where: { id: circle.id }, data: { viewCount: { increment: 1 } } }),
      ]);
      circle.viewCount += 1;
    }
  }

  const reviews = circle.reviews || [];
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  res.json(new ApiResponse(200, { ...circle, avgRating, reviewCount: reviews.length, ratingDistribution }));
});

const trackClick = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({
    where: { id: req.params.id, deletedAt: null, status: "ACTIVE" },
  });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  await prisma.circle.update({ where: { id: circle.id }, data: { clickCount: { increment: 1 } } });
  res.json(new ApiResponse(200, null, "Click qayd etildi"));
});

const listCirclesByCourseCenter = asyncHandler(async (req, res) => {
  const circles = await prisma.circle.findMany({
    where: { courseCenterId: req.params.centerId, status: "ACTIVE", deletedAt: null },
    select: publicListSelect,
    orderBy: { direction: "asc" },
  });
  res.json(new ApiResponse(200, circles));
});

const createCircle = asyncHandler(async (req, res) => {
  const {
    name, category, direction, type, description, tavsif, priceType, priceAmount,
    currency, pricePeriod, address, latitude, longitude, ageGroupMin, ageGroupMax,
    contactPhone, contactTelegram, courseCenterId,
  } = req.body;

  if (!["UY", "ONLINE", "KURS"].includes(type)) {
    throw ApiError.badRequest("Togarak turi noto'g'ri: UY, ONLINE yoki KURS bo'lishi kerak");
  }

  if (type === "KURS") {
    if (!courseCenterId) {
      throw ApiError.badRequest("Kurs turi uchun courseCenterId yuborilishi kerak");
    }
    const center = await prisma.courseCenter.findFirst({ where: { id: courseCenterId, deletedAt: null } });
    if (!center) throw ApiError.notFound("O'quv markazi topilmadi");
    if (center.ownerId !== req.user.id && req.user.role !== "ADMIN") {
      throw ApiError.forbidden("Bu o'quv markaziga togarak qo'sha olmaysiz");
    }
  } else if (courseCenterId) {
    throw ApiError.badRequest("UY yoki ONLINE turida courseCenterId yuborilmasligi kerak");
  }

  // Fayl yuklash (ImgBB kaliti bo'lsa bulutga, bo'lmasa lokal diskka) yoki to'liq rasm URL
  const fileImages = await Promise.all(
    (req.files || []).map(async (f) => (await uploadToCloud(f.path, f.filename)).url)
  );
  let urlImages = [];
  if (req.body.imageUrls) {
    let raw = req.body.imageUrls;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = raw.split(",").map((s) => s.trim()); }
    }
    urlImages = (Array.isArray(raw) ? raw : [raw])
      .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()))
      .map((u) => u.trim());
  }
  const images = [...fileImages, ...urlImages].slice(0, 2);
  if (images.length > 2) throw ApiError.badRequest("Maksimum 2 ta rasm bo'lishi mumkin");

  const circle = await prisma.circle.create({
    data: {
      name, category, direction, type, description, tavsif, images, priceType,
      priceAmount: priceAmount ? Number(priceAmount) : null,
      currency: currency || null,
      pricePeriod: pricePeriod || null,
      address,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      ageGroupMin: ageGroupMin ? Number(ageGroupMin) : null,
      ageGroupMax: ageGroupMax ? Number(ageGroupMax) : null,
      contactPhone, contactTelegram,
      materialsIncluded: optionalBool(req.body.materialsIncluded),
      refundable: optionalBool(req.body.refundable),
      extraCostsNote: req.body.extraCostsNote || null,
      status: "PENDING",
      ownerId: req.user.id,
      courseCenterId: type === "KURS" ? courseCenterId : null,
    },
  });

  res.status(201).json(
    new ApiResponse(201, circle, "Togarak yaratildi. Kamida bitta guruh qo'shing, so'ng moderatsiya kutiladi")
  );
});

const updateCircle = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu togarakni tahrirlash huquqingiz yo'q");
  }

  const allowedFields = [
    "name", "category", "direction", "description", "tavsif", "priceType", "priceAmount",
    "currency", "pricePeriod", "address", "latitude", "longitude", "ageGroupMin", "ageGroupMax",
    "contactPhone", "contactTelegram", "extraCostsNote",
  ];
  const data = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  }
  if (data.extraCostsNote !== undefined) data.extraCostsNote = data.extraCostsNote || null;
  if (req.body.materialsIncluded !== undefined) data.materialsIncluded = optionalBool(req.body.materialsIncluded);
  if (req.body.refundable !== undefined) data.refundable = optionalBool(req.body.refundable);
  if (data.priceAmount !== undefined) data.priceAmount = data.priceAmount ? Number(data.priceAmount) : null;
  if (data.latitude !== undefined) data.latitude = data.latitude ? Number(data.latitude) : null;
  if (data.longitude !== undefined) data.longitude = data.longitude ? Number(data.longitude) : null;
  if (data.ageGroupMin !== undefined) data.ageGroupMin = data.ageGroupMin ? Number(data.ageGroupMin) : null;
  if (data.ageGroupMax !== undefined) data.ageGroupMax = data.ageGroupMax ? Number(data.ageGroupMax) : null;

  // To'liq images massivi yuborilsa — almashtiriladi (URL lar uchun)
  if (req.body.images !== undefined) {
    let raw = req.body.images;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = raw ? [raw] : []; }
    }
    data.images = (Array.isArray(raw) ? raw : [])
      .filter((u) => typeof u === "string" && u.trim())
      .map((u) => u.trim())
      .slice(0, 2);
  } else {
    let images = [...(circle.images || [])];
    let removeList = req.body.removeImages;
    if (typeof removeList === "string") {
      try { removeList = JSON.parse(removeList); } catch { removeList = [removeList]; }
    }
    if (Array.isArray(removeList) && removeList.length) {
      images = images.filter((url) => !removeList.includes(url));
    }
    const newFiles = await Promise.all(
      (req.files || []).map(async (f) => (await uploadToCloud(f.path, f.filename)).url)
    );
    // Qo'shimcha URL lar
    let urlImages = [];
    if (req.body.imageUrls) {
      let raw = req.body.imageUrls;
      if (typeof raw === "string") {
        try { raw = JSON.parse(raw); } catch { raw = raw.split(",").map((s) => s.trim()); }
      }
      urlImages = (Array.isArray(raw) ? raw : [raw])
        .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()))
        .map((u) => u.trim());
    }
    images = [...images, ...newFiles, ...urlImages].slice(0, 2);
    if (newFiles.length || urlImages.length || (Array.isArray(removeList) && removeList.length)) {
      data.images = images;
    }
  }

  if (Object.keys(data).length > 0 && req.user.role !== "ADMIN" && circle.status === "ACTIVE") {
    data.status = "PENDING";
  }

  const updated = await prisma.circle.update({ where: { id: req.params.id }, data });
  res.json(new ApiResponse(200, updated, "Yangilandi"));
});

const deleteCircle = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu togarakni o'chirish huquqingiz yo'q");
  }
  await prisma.circle.update({
    where: { id: req.params.id },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });
  res.json(new ApiResponse(200, null, "Togarak arxivlandi (soft-delete)"));
});

const restoreCircle = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findUnique({ where: { id: req.params.id } });
  if (!circle || !circle.deletedAt) throw ApiError.notFound("Arxivlangan togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") throw ApiError.forbidden();
  const updated = await prisma.circle.update({
    where: { id: circle.id },
    data: { deletedAt: null, status: "PENDING" },
  });
  res.json(new ApiResponse(200, updated, "Togarak qayta tiklandi, qayta moderatsiya kutiladi"));
});

const myCircles = asyncHandler(async (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";
  const circles = await prisma.circle.findMany({
    where: { ownerId: req.user.id, ...(includeDeleted ? {} : { deletedAt: null }) },
    include: { _count: { select: { groups: true, results: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(new ApiResponse(200, circles));
});

const uploadVideoTour = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Bu togarakka video yuklash huquqingiz yo'q");
  }
  // Startup bosqichi: video-tur bepul
  if (!req.file) throw ApiError.badRequest("Video fayl yuborilmadi");
  const videoUrl = `/uploads/videos/${req.file.filename}`;
  const updated = await prisma.circle.update({ where: { id: circle.id }, data: { videoUrl } });
  res.json(new ApiResponse(200, updated, "Video muvaffaqiyatli yuklandi"));
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!["ACTIVE", "INACTIVE", "PENDING", "REJECTED", "ARCHIVED"].includes(status)) {
    throw ApiError.badRequest("Status noto'g'ri");
  }
  const circle = await prisma.circle.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { _count: { select: { groups: true } } },
  });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (status === "ACTIVE" && circle._count.groups === 0) {
    throw ApiError.badRequest("Kamida bitta guruh qo'shilmagan togarakni ACTIVE qilib bo'lmaydi");
  }
  const data = { status };
  if (status === "ARCHIVED") data.deletedAt = new Date();
  const updated = await prisma.circle.update({ where: { id: circle.id }, data });
  if (["ACTIVE", "REJECTED"].includes(status) && circle.status !== status) {
    notifyCircleModeration(circle, status, reason).catch(() => {});
  }
  res.json(new ApiResponse(200, updated, "Status yangilandi"));
});

const listPending = asyncHandler(async (req, res) => {
  const circles = await prisma.circle.findMany({
    where: { status: "PENDING", deletedAt: null },
    include: {
      _count: { select: { groups: true } },
      owner: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(new ApiResponse(200, circles));
});

const getCircleStats = asyncHandler(async (req, res) => {
  const circle = await prisma.circle.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      _count: { select: { results: true, groups: true } },
      groups: { select: { maxStudents: true, takenStudents: true, status: true } },
    },
  });
  if (!circle) throw ApiError.notFound("Togarak topilmadi");
  if (circle.ownerId !== req.user.id && req.user.role !== "ADMIN") throw ApiError.forbidden();

  const totalCapacity = circle.groups.reduce((sum, g) => sum + (g.maxStudents || 0), 0);
  const totalTaken = circle.groups.reduce((sum, g) => sum + g.takenStudents, 0);
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [views7, views30] = await Promise.all([
    prisma.circleView.count({ where: { circleId: circle.id, createdAt: { gte: d7 } } }),
    prisma.circleView.count({ where: { circleId: circle.id, createdAt: { gte: d30 } } }),
  ]);

  res.json(
    new ApiResponse(200, {
      status: circle.status,
      groupsCount: circle._count.groups,
      resultsCount: circle._count.results,
      hasVideoTour: Boolean(circle.videoUrl),
      imagesCount: circle.images.length,
      totalCapacity,
      totalTaken,
      freeSeats: Math.max(totalCapacity - totalTaken, 0),
      viewCount: circle.viewCount,
      clickCount: circle.clickCount,
      viewsLast7Days: views7,
      viewsLast30Days: views30,
      createdAt: circle.createdAt,
    })
  );
});

export {
  listCircles, getCircleById, listCirclesByCourseCenter, createCircle, updateCircle,
  deleteCircle, restoreCircle, myCircles, uploadVideoTour, changeStatus, listPending,
  getCircleStats, trackClick,
};
