import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "../src/config/db.js";

const CATEGORIES = [
  "Til o'rganish",
  "Matematika",
  "IT va dasturlash",
  "San'at",
  "Musiqa",
  "Sport",
  "Raqs",
  "Robototexnika",
  "Shaxmat",
  "Boshqa",
];

const DISTRICTS = [
  "Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Sergeli", "Mirobod",
  "Yakkasaroy", "Shayxontohur", "Olmazor", "Bektemir", "Yashnobod"
];

const TEACHER_NAMES = [
  "Jahongir Olimov", "Shoxrux Tursunov", "Otabek Fayzullayev",
  "Madina Karimova", "Azizbek Rahimov", "Nilufar Yusupova",
  "Bobur Aliyev", "Zulfiya Xasanova", "Temur Nazarov", "Dilnoza Saidova",
  "Sardor Usmonov", "Kamola Tursunova", "Behzod Raximov", "Gulnora Abdullayeva",
  "Firdavs Karimov", "Sevinch Alimova", "Jasur Xolmatov", "Mohira Sultanova",
  "Rustam Jo'rayev", "Nodira Qodirova"
];

const CENTER_NAMES = [
  { name: "Cambridge Premium Club", desc: "Mini-guruhlarda chuqurlashtirilgan ingliz tili darslari" },
  { name: "Real Science", desc: "Prezident maktabiga matematika va mantiqdan tayyorlov" },
  { name: "Everest Academy", desc: "IELTS va SAT dan professional tayyorlov markazi" },
  { name: "CoddyCamp IT Academy", desc: "Bolalar uchun dasturlash va robototexnika akademiyasi" },
  { name: "Art Studio Uz", desc: "Rassomchilik va dizayn bo'yicha professional studiya" },
  { name: "Melody Music School", desc: "Pianino, gitara va vokal bo'yicha xalqaro standartlar" },
  { name: "Champion Sports Club", desc: "Suzish, tennis va futbol bo'yicha professional mashg'ulotlar" },
  { name: "Grace Dance Academy", desc: "Zamonaviy va klassik raqs san'ati akademiyasi" },
  { name: "Chess Grandmaster Academy", desc: "Shaxmat bo'yicha xalqaro toifali ustozlardan ta'lim" },
  { name: "RoboTech Lab", desc: "Robototexnika va AI asoslari bo'yicha zamonaviy laboratoriya" },
];

const CENTER_IMAGES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop",
];

const CIRCLE_IMAGES = [
  // IT va dasturlash (5 ta)
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop",
  // Til o'rganish (6 ta)
  "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=800&auto=format&fit=crop",
  // Matematika (4 ta)
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop",
  // San'at (4 ta)
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop",
  // Musiqa (4 ta)
  "https://images.unsplash.com/photo-1552422535-c45813c61732?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop",
  // Sport (4 ta)
  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
  // Raqs (4 ta) - almashtirildi
  "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&auto=format&fit=crop",
  // Robototexnika (3 ta)
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop",
  // Shaxmat (2 ta)
  "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&auto=format&fit=crop",
];

const CIRCLE_DATA = [
  // IT va dasturlash
  { name: "Python Dasturlash Asoslari", category: "IT va dasturlash", direction: "Python", price: 500000, duration: 6 },
  { name: "Web Dasturlash: Frontend", category: "IT va dasturlash", direction: "Web Development", price: 600000, duration: 8 },
  { name: "Mobil Ilovalar: Flutter", category: "IT va dasturlash", direction: "Flutter", price: 700000, duration: 10 },
  { name: "JavaScript va React", category: "IT va dasturlash", direction: "JavaScript", price: 650000, duration: 9 },
  { name: "Cybersecurity Asoslari", category: "IT va dasturlash", direction: "Xavfsizlik", price: 800000, duration: 12 },
  
  // Til o'rganish
  { name: "IELTS Intensive 7.5+", category: "Til o'rganish", direction: "Ingliz tili", price: 750000, duration: 12 },
  { name: "General English A1-B2", category: "Til o'rganish", direction: "Ingliz tili", price: 450000, duration: 10 },
  { name: "Rus tili: Boshlang'ich", category: "Til o'rganish", direction: "Rus tili", price: 400000, duration: 8 },
  { name: "Koreys tili: TOPIK", category: "Til o'rganish", direction: "Koreys tili", price: 550000, duration: 12 },
  { name: "Nemis tili: B1-B2", category: "Til o'rganish", direction: "Nemis tili", price: 500000, duration: 10 },
  { name: "Arab tili: Qur'on o'qish", category: "Til o'rganish", direction: "Arab tili", price: 350000, duration: 8 },
  
  // Matematika
  { name: "Prezident Maktabiga Tayyorlov", category: "Matematika", direction: "Matematika", price: 800000, duration: 12 },
  { name: "Olimpiada Matematikasi", category: "Matematika", direction: "Matematika", price: 700000, duration: 12 },
  { name: "Algebra va Geometriya", category: "Matematika", direction: "Matematika", price: 500000, duration: 10 },
  { name: "Yuqori Matematika", category: "Matematika", direction: "Matematika", price: 600000, duration: 12 },
  
  // San'at
  { name: "Akademik Rassomchilik", category: "San'at", direction: "Rassomchilik", price: 450000, duration: 12 },
  { name: "Raqamli Dizayn: Photoshop", category: "San'at", direction: "Grafik dizayn", price: 550000, duration: 8 },
  { name: "Haykaltaroshlik Asoslari", category: "San'at", direction: "Haykaltaroshlik", price: 500000, duration: 10 },
  { name: "Kalligrafiya San'ati", category: "San'at", direction: "Kalligrafiya", price: 400000, duration: 6 },
  
  // Musiqa
  { name: "Pianino: Klassik", category: "Musiqa", direction: "Pianino", price: 600000, duration: 12 },
  { name: "Gitara: Akustik va Elektro", category: "Musiqa", direction: "Gitara", price: 500000, duration: 10 },
  { name: "Vokal: Pop va Jazz", category: "Musiqa", direction: "Vokal", price: 550000, duration: 12 },
  { name: "Skripka: Boshlang'ich", category: "Musiqa", direction: "Skripka", price: 650000, duration: 12 },
  
  // Sport
  { name: "Suzish: Professional", category: "Sport", direction: "Suzish", price: 700000, duration: 12 },
  { name: "Tennis: Katta Kort", category: "Sport", direction: "Tennis", price: 800000, duration: 12 },
  { name: "Futbol: Yoshlar Ligasi", category: "Sport", direction: "Futbol", price: 450000, duration: 12 },
  { name: "Basketbol: Dribbling", category: "Sport", direction: "Basketbol", price: 500000, duration: 10 },
  
  // Raqs
  { name: "Zamonaviy Raqs: Hip-Hop", category: "Raqs", direction: "Hip-Hop", price: 450000, duration: 10 },
  { name: "Klassik Balet", category: "Raqs", direction: "Balet", price: 600000, duration: 12 },
  { name: "Lotin Raqslari", category: "Raqs", direction: "Salsa", price: 500000, duration: 10 },
  { name: "Xalq Raqslari", category: "Raqs", direction: "O'zbek raqsi", price: 400000, duration: 8 },
  
  // Robototexnika
  { name: "Lego Mindstorms", category: "Robototexnika", direction: "Robototexnika", price: 600000, duration: 10 },
  { name: "Arduino Dasturlash", category: "Robototexnika", direction: "Arduino", price: 550000, duration: 8 },
  { name: "Drone Pilotaj", category: "Robototexnika", direction: "Dron", price: 700000, duration: 6 },
  
  // Shaxmat
  { name: "Shaxmat: Boshlang'ich", category: "Shaxmat", direction: "Shaxmat", price: 400000, duration: 10 },
  { name: "Shaxmat: Turnir Tayyorlov", category: "Shaxmat", direction: "Shaxmat", price: 550000, duration: 12 },
];

const RESULTS_BY_CATEGORY = {
  "IT va dasturlash": [
    { title: "Freelance loyiha muvaffaqiyatli topshirildi", type: "LOYIHA" },
    { title: "Open Source hissasi qo'shildi", type: "LOYIHA" },
    { title: "Startup MVP ishga tushirildi", type: "LOYIHA" },
    { title: "Hackathon g'olibi", type: "MUSOBAQA" },
    { title: "Professional sertifikat olindi", type: "SERTIFIKAT" },
  ],
  "Til o'rganish": [
    { title: "IELTS 8.0 natija", type: "IMTIHON" },
    { title: "IELTS 7.5 natija", type: "IMTIHON" },
    { title: "TOPIK Level 5", type: "IMTIHON" },
    { title: "SAT 1500+", type: "IMTIHON" },
    { title: "CEFR B2 sertifikat", type: "SERTIFIKAT" },
  ],
  "Matematika": [
    { title: "Respublika olimpiadasi g'olibi", type: "MUSOBAQA" },
    { title: "Prezident maktabi talabasi", type: "KIRIM" },
    { title: "Xalqaro matematika musobaqasi sovrindori", type: "MUSOBAQA" },
    { title: "Maktab olimpiadasi 1-o'rin", type: "MUSOBAQA" },
    { title: "NTM 190+ ball", type: "IMTIHON" },
  ],
  "San'at": [
    { title: "Respublika ko'rgazma ishtirokchisi", type: "KORGAZMA" },
    { title: "Xalqaro dizayn tanlovi finalchisi", type: "MUSOBAQA" },
    { title: "Portfolio loyiha tayyorlandi", type: "LOYIHA" },
    { title: "Art-loyiha namoyish etildi", type: "LOYIHA" },
    { title: "Kalligrafiya tanlovi sovrindori", type: "MUSOBAQA" },
  ],
  "Musiqa": [
    { title: "Respublika musiqa tanlovi laureati", type: "MUSOBAQA" },
    { title: "Konsert dasturida ishtirok", type: "KONSERT" },
    { title: "Musobaqa g'olibi", type: "MUSOBAQA" },
    { title: "Sertifikatlangan daraja olindi", type: "SERTIFIKAT" },
    { title: "Yakka konsert berdi", type: "KONSERT" },
  ],
  "Sport": [
    { title: "Shahar chempionati g'olibi", type: "MUSOBAQA" },
    { title: "Respublika musobaqasi sovrindori", type: "MUSOBAQA" },
    { title: "Xalqaro turnir ishtirokchisi", type: "MUSOBAQA" },
    { title: "Sport razryadi bajarildi", type: "SERTIFIKAT" },
    { title: "Liga o'yinlarida ishtirok", type: "MUSOBAQA" },
  ],
  "Raqs": [
    { title: "Raqs tanlovi g'olibi", type: "MUSOBAQA" },
    { title: "Spektakl bosh partiyasi", type: "KONSERT" },
    { title: "Respublika festivali ishtirokchisi", type: "FESTIVAL" },
    { title: "Xalqaro raqs musobaqasi finalchisi", type: "MUSOBAQA" },
    { title: "Yakka konsert dasturi", type: "KONSERT" },
  ],
  "Robototexnika": [
    { title: "Robototexnika musobaqasi g'olibi", type: "MUSOBAQA" },
    { title: "Loyiha taqdimoti muvaffaqiyatli o'tdi", type: "LOYIHA" },
    { title: "Xalqaro STEM tanlov ishtirokchisi", type: "MUSOBAQA" },
    { title: "Innovatsion loyiha granti yutdi", type: "GRANT" },
    { title: "Texnik ko'rik-tanlov sovrindori", type: "MUSOBAQA" },
  ],
  "Shaxmat": [
    { title: "Shaxmat turniri g'olibi", type: "MUSOBAQA" },
    { title: "Reyting 2000+ ga ko'tarildi", type: "REYTING" },
    { title: "Xalqaro musobaqa ishtirokchisi", type: "MUSOBAQA" },
    { title: "FM normasi bajarildi", type: "SERTIFIKAT" },
    { title: "Klub chempionati 1-o'rin", type: "MUSOBAQA" },
  ],
  "Boshqa": [
    { title: "Tugallash sertifikati olindi", type: "SERTIFIKAT" },
    { title: "Yakuniy loyiha muvaffaqiyatli himoya qilindi", type: "LOYIHA" },
    { title: "Ko'rgazmada ishtirok etdi", type: "KORGAZMA" },
  ],
};

async function main() {
  console.log(" Ma'lumotlar bazasi tozalanmoqda...");
  
  // Barcha ma'lumotlarni o'chirish (teskari tartibda)
  await prisma.result.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.circle.deleteMany({});
  await prisma.courseCenter.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log("✅ Baza tozalandi");

  // Foydalanuvchilarni yaratish
  const passwordHash = await bcrypt.hash("admin12345", 10);
  const userPasswordHash = await bcrypt.hash("user12345", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@velox.uz",
      firstName: "Admin",
      lastName: "Velox",
      role: "ADMIN",
      password: passwordHash,
      isVerified: true,
    },
  });

  const users = [adminUser];
  const userNames = [
    { first: "Malik", last: "Yuldashov" },
    { first: "Aziza", last: "Karimova" },
    { first: "Bobur", last: "Aliyev" },
    { first: "Dilnoza", last: "Saidova" },
  ];

  for (const name of userNames) {
    const user = await prisma.user.create({
      data: {
        email: `${name.first.toLowerCase()}@example.com`,
        firstName: name.first,
        lastName: name.last,
        role: "USER",
        password: userPasswordHash,
        isVerified: true,
      },
    });
    users.push(user);
  }

  console.log(`👥 ${users.length} ta foydalanuvchi yaratildi`);

  // O'quv markazlarini yaratish
  const centers = [];
  for (let i = 0; i < CENTER_NAMES.length; i++) {
    const centerData = CENTER_NAMES[i];
    const district = DISTRICTS[i % DISTRICTS.length];
    const owner = users[i % users.length];
    
    const center = await prisma.courseCenter.create({
      data: {
        name: centerData.name,
        description: centerData.desc,
        address: `${district} tumani, ${district} ko'chasi ${i + 1}`,
        contactPhone: `+99871200${String(i).padStart(4, '0')}`,
        contactTelegram: `@${centerData.name.toLowerCase().replace(/\s+/g, '_')}`,
        isVerified: true,
        ownerId: owner.id,
        images: [CENTER_IMAGES[i % CENTER_IMAGES.length]],
      },
    });
    centers.push(center);
  }

  console.log(`🏫 ${centers.length} ta o'quv markazi yaratildi`);

  // To'garaklarni yaratish
  const circles = [];
  for (let i = 0; i < CIRCLE_DATA.length; i++) {
    const circleData = CIRCLE_DATA[i];
    const center = centers[i % centers.length];
    const district = DISTRICTS[i % DISTRICTS.length];
    const teacher = TEACHER_NAMES[i % TEACHER_NAMES.length];
    const maxStudents = 8 + (i % 8);
    const takenStudents = Math.floor(maxStudents * (0.6 + Math.random() * 0.3));
    const successRate = 75 + Math.floor(Math.random() * 20);
    
    const circle = await prisma.circle.create({
      data: {
        name: circleData.name,
        category: circleData.category,
        direction: circleData.direction,
        type: i % 5 === 0 ? "ONLINE" : i % 4 === 0 ? "UY" : "KURS",
        description: `${circleData.name} bo'yicha professional ta'lim. Tajribali ustozlar va zamonaviy uslublar.`,
        tavsif: `Haftada ${2 + (i % 3)} kun, ${1 + (i % 2)} soatdan. Amaliy mashg'ulotlar va individual yondashuv.`,
        priceType: "FIXED",
        priceAmount: circleData.price,
        currency: "UZS",
        pricePeriod: "MONTHLY",
        address: `${district} filiali, ${district} ko'chasi`,
        ageGroupMin: 6 + (i % 5),
        ageGroupMax: 14 + (i % 8),
        status: "ACTIVE",
        isVerified: true,
        successRate: successRate,
        durationMonths: circleData.duration,
        ownerId: center.ownerId,
        courseCenterId: center.id,
        images: [CIRCLE_IMAGES[i % CIRCLE_IMAGES.length]],
        groups: {
          create: [
            {
              name: `${circleData.name} - Guruh ${String.fromCharCode(65 + (i % 3))}`,
              teacherName: teacher,
              teacherBio: `${5 + (i % 10)} yillik tajriba`,
              maxStudents: maxStudents,
              takenStudents: takenStudents,
              status: "ACTIVE",
              schedule: { 
                days: [["Dush", "Chor", "Jum"], ["Sesh", "Pay", "Shan"]][i % 2], 
                time: `${14 + (i % 6)}:00 - ${15 + (i % 3)}:30` 
              },
            },
          ],
        },
        results: {
          create: (() => {
            const pool = RESULTS_BY_CATEGORY[circleData.category] || RESULTS_BY_CATEGORY["Boshqa"];
            const r = pool[i % pool.length];
            return [{
              title: r.title,
              type: r.type,
              studentName: `O'quvchi ${i + 1}`,
              imageUrl: CIRCLE_IMAGES[(i + 10) % CIRCLE_IMAGES.length],
              verified: true,
            }];
          })(),
        },
      },
    });
    circles.push(circle);
  }

  console.log(`📚 ${circles.length} ta to'garak yaratildi`);
  console.log("\n✅ Seed muvaffaqiyatli yakunlandi!");
  console.log("\n📊 Statistika:");
  console.log(`   - Foydalanuvchilar: ${users.length}`);
  console.log(`   - O'quv markazlari: ${centers.length}`);
  console.log(`   - To'garaklar: ${circles.length}`);
  console.log("\n🔐 Admin hisobi:");
  console.log(`   Email: admin@velox.uz`);
  console.log(`   Parol: admin12345`);
}

main()
  .catch((e) => {
    console.error("❌ Seed xatoligi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
