/**
 * Prisma seed - E2E user for testing
 * e2e@test.com / e2e-secret (passwordHash from bcryptjs)
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const ANONYMOUS_USER_ID = "anonymous-user-id";
const E2E_PASSWORD_HASH = bcrypt.hashSync("e2e-secret", 10);
const TRIAL_END = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

async function main() {
  await prisma.user.upsert({
    where: { id: "e2e-user-1" },
    update: { passwordHash: E2E_PASSWORD_HASH, trialEndsAt: TRIAL_END },
    create: {
      id: "e2e-user-1",
      email: "e2e@test.com",
      name: "E2E Test User",
      passwordHash: E2E_PASSWORD_HASH,
      trialEndsAt: TRIAL_END,
    },
  });

  await prisma.user.upsert({
    where: { id: ANONYMOUS_USER_ID },
    update: {},
    create: {
      id: ANONYMOUS_USER_ID,
      email: "anonymous@agentflow.local",
      name: "Anonymous",
    },
  });

  const e2eUserId = "e2e-user-1";

  // UserTemplate - 2 samples for tourism
  await prisma.userTemplate.upsert({
    where: { id: "seed-template-1" },
    update: {},
    create: {
      id: "seed-template-1",
      userId: e2eUserId,
      name: "Apartmaji Bela Krajina",
      category: "tourism",
      basePrompt: "booking-description",
      customVars: {
        lokacija: "Črnomelj, Bela Krajina",
        tip: "apartma",
        osebe: "4",
        sobe: "2",
        posebnosti: "WiFi, parkirišče, vrt",
        atrakcije: "Reka Kolpa, Vinogradi",
        jezik: "SL",
        ton: "prijazen",
        kljucne_besede: "apartmaji bela krajina, počitnice kolpa",
      },
    },
  });
  await prisma.userTemplate.upsert({
    where: { id: "seed-template-2" },
    update: {},
    create: {
      id: "seed-template-2",
      userId: e2eUserId,
      name: "Družinski opis",
      category: "tourism",
      basePrompt: "airbnb-story",
      customVars: {
        jezik: "SL",
        lokacija: "Bohinj",
        posebnosti: "Igrišče, vrt, blizu jezera",
      },
    },
  });

  // LandingPage - 1 sample
  await prisma.landingPage.upsert({
    where: { slug: "seed-landing-bela-krajina" },
    update: {},
    create: {
      userId: e2eUserId,
      title: "Apartmaji Bela Krajina – Seed",
      slug: "seed-landing-bela-krajina",
      content: { hero: { heading: "Dobrodošli v Beli Krajini", body: "Vaša nova destinacija za počitnice." }, about: { heading: "O nas", body: "Topla gostoljubnost." }, cta: { heading: "Rezervirajte", body: "Od 65€/noč" } },
      template: "tourism-basic",
      languages: ["sl", "en"],
      isPublished: false,
      seoTitle: "Apartmaji Bela Krajina | Počitnice ob Kolpi",
      seoDescription: "Odkrijte apartmaje v Beli Krajini. WiFi, parkirišče. Rezervirajte zdaj.",
    },
  });

  // TranslationJob - 1 completed job
  await prisma.translationJob.upsert({
    where: { id: "seed-translation-1" },
    update: {},
    create: {
      id: "seed-translation-1",
      userId: e2eUserId,
      sourceContent: "Dobrodošli v našem apartmaju. Idealno za družinske počitnice.",
      sourceLang: "sl",
      targetLangs: ["en", "de"],
      status: "completed",
      results: { en: "Welcome to our apartment. Ideal for family holidays.", de: "Willkommen in unserer Wohnung. Ideal für Familienurlaub." },
      completedAt: new Date(),
    },
  });

  // BlogPost - 2 samples
  await prisma.blogPost.upsert({
    where: { id: "seed-blog-1" },
    update: {},
    create: {
      id: "seed-blog-1",
      userId: e2eUserId,
      title: "5 nasvetov za počitnice v Beli Krajini",
      topic: "Bela Krajina tourism",
      fullContent: "# 5 nasvetov za počitnice v Beli Krajini\n\nOdkrijte skrivnosti te čudovite regije...",
      metaTitle: "5 nasvetov za počitnice v Beli Krajini",
      metaDescription: "Praktični nasveti za obisk Bele Krajine. Apartmaji, aktivnosti, lokalne specialitete.",
    },
  });
  await prisma.blogPost.upsert({
    where: { id: "seed-blog-2" },
    update: {},
    create: {
      id: "seed-blog-2",
      userId: e2eUserId,
      title: "Kolpa – reka za vsa letna časa",
      topic: "Kolpa river activities",
      fullContent: "# Kolpa – reka za vsa letna časa\n\nReka Kolpa ponuja številne možnosti za aktivnosti...",
      metaTitle: "Kolpa – reka za vsa letna časa",
      metaDescription: "Vodni šport, kopanje in narava ob reki Kolpi.",
    },
  });

  // SeoMetric - 5 mock keywords
  const keywords = [
    { keyword: "apartmaji bela krajina", position: 8, volume: 320, difficulty: 35 },
    { keyword: "počitnice kolpa", position: 15, volume: 180, difficulty: 28 },
    { keyword: "namestitev črnomelj", position: 4, volume: 90, difficulty: 22 },
    { keyword: "apartma z bazenom bela krajina", position: 22, volume: 45, difficulty: 18 },
    { keyword: "družinske počitnice slovenija", position: 12, volume: 210, difficulty: 40 },
  ];
  for (let i = 0; i < keywords.length; i++) {
    const k = keywords[i];
    await prisma.seoMetric.upsert({
      where: { id: `seed-seo-${i + 1}` },
      update: {},
      create: {
        id: `seed-seo-${i + 1}`,
        userId: e2eUserId,
        contentType: "landing",
        keyword: k.keyword,
        position: k.position,
        searchVolume: k.volume,
        difficulty: k.difficulty,
        lastChecked: new Date(),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
