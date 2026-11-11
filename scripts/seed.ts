import 'dotenv/config';
import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import { Sequelize } from 'sequelize-typescript';
import { buildSearchText } from '../src/business/domain/entities/video.js';
import {
  LedgerAccount,
  LedgerKind,
  LicenceDuration,
  LicenceStatus,
  PaymentStatus,
  VideoCategory,
  VideoStatus,
} from '../src/business/domain/values/enums.js';
import { licenceEndDate, licencePriceKobo, type LicencePart, splitPrice } from '../src/business/domain/values/pricing.js';
import { MockAiAdapter } from '../src/web/adapters/mock-ai.adapter.js';
import { ScryptPasswordHasher } from '../src/web/adapters/scrypt-password-hasher.js';
import {
  ALL_MODELS,
  LedgerEntryModel,
  LicenceModel,
  PaymentModel,
  UserModel,
  VideoModel,
} from '../src/web/database/models/index.js';

const DAY = 24 * 60 * 60 * 1000;
const DEMO_PASSWORD = 'demo1234';
const ago = (days: number) => new Date(Date.now() - days * DAY);
const face = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=faces&w=160&h=160&q=75`;
const still = (path: string) => `https://images.pexels.com/videos/${path}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const clip = (path: string) => `https://videos.pexels.com/video-files/${path}`;

const POSTERS = {
  ember: ['#E2552D', '#F2C14E'],
  night: ['#1A141F', '#3B4A6B'],
  palm: ['#1F5E45', '#C9D66B'],
  indigo: ['#1D3A7A', '#E2552D'],
  sand: ['#C7834E', '#F5E6D3'],
  sky: ['#1D4E89', '#7FC8F8'],
} as const;

const USERS = [
  { key: 'tolu', name: 'Tolu Adeyemi', email: 'tolu@demo.ami', businessName: null, avatar: 'photo-1768244017009-ae72704195cb', verified: true, isAdmin: false, days: 90 },
  { key: 'chinedu', name: 'Chinedu Okafor', email: 'chinedu@demo.ami', businessName: null, avatar: 'photo-1586474714722-d1f9e551cf34', verified: false, isAdmin: false, days: 70 },
  { key: 'aisha', name: 'Aisha Bello', email: 'aisha@demo.ami', businessName: "Aisha's Kitchen", avatar: 'photo-1680878790148-18c83f270499', verified: false, isAdmin: false, days: 60 },
  { key: 'kemi', name: 'Kemi Johnson', email: 'kemi@demo.ami', businessName: null, avatar: 'photo-1677935711525-1059c0cb9b44', verified: false, isAdmin: false, days: 45 },
  { key: 'brand', name: 'Ada Nwosu', email: 'brand@demo.ami', businessName: 'Zobo & Co.', avatar: 'photo-1697383904932-94304530a3dd', verified: false, isAdmin: false, days: 20 },
  { key: 'blog', name: 'Femi Lawal', email: 'blog@demo.ami', businessName: 'Gist Central', avatar: 'photo-1522529599102-193c0d76b5b6', verified: false, isAdmin: false, days: 30 },
  { key: 'admin', name: 'Àmì Admin', email: 'admin@demo.ami', businessName: 'Àmì', avatar: null, verified: true, isAdmin: true, days: 100 },
];

interface SeedVideo {
  key: string;
  creator: string;
  title: string;
  description: string;
  category: VideoCategory;
  tags: string[];
  poster: keyof typeof POSTERS;
  still: string;
  clip: string;
  durationSec: number;
  days: number;
  priceNaira?: number;
  status?: VideoStatus;
}

const VIDEOS: SeedVideo[] = [
  { key: 'nepa', creator: 'tolu', title: 'When the light comes back at 3am', description: "The whole street wakes up at once. Generator off, fans on, someone shouting 'Up NEPA!' from two compounds away.", category: VideoCategory.COMEDY, tags: ['nepa', 'light', 'lagos', 'man laughing', 'night'], poster: 'ember', still: '8496469/adult-bald-black-model-business-8496469', clip: '8496469/8496469-sd_960_540_25fps.mp4', durationSec: 8, days: 3 },
  { key: 'mum', creator: 'tolu', title: "My mum when I say I'm not hungry", description: 'Every Nigerian child knows this conversation. It ends with a full plate anyway.', category: VideoCategory.COMEDY, tags: ['family', 'food', 'mum', 'woman talking', 'home'], poster: 'night', still: '7594690/access-adult-african-american-analyzing-7594690', clip: '7594690/7594690-sd_960_540_25fps.mp4', durationSec: 19, days: 12 },
  { key: 'startup', creator: 'tolu', title: 'First day at a Lagos startup', description: "Standup at 9, 'quick sync' at 10, pizza at 7pm, and nobody has explained what the company does.", category: VideoCategory.LIFESTYLE, tags: ['work', 'tech', 'lagos', 'office', 'talking to camera'], poster: 'indigo', still: '4994033/pexels-photo-4994033', clip: '4994033/4994033-sd_960_540_25fps.mp4', durationSec: 8, days: 25 },
  { key: 'exam', creator: 'tolu', title: 'Exam season in a Nigerian home', description: 'TV off, data off, and somehow every relative has started calling to ask about your results.', category: VideoCategory.COMEDY, tags: ['school', 'family', 'home'], poster: 'sky', still: '5664462/african-dancing-headphones-listening-5664462', clip: '5664462/5664462-sd_960_540_25fps.mp4', durationSec: 10, days: 40, status: VideoStatus.HIDDEN },
  { key: 'danfo', creator: 'chinedu', title: 'Danfo conductor vs. ₦50 change', description: 'A negotiation that has lasted three bus stops and is not close to ending.', category: VideoCategory.COMEDY, tags: ['danfo', 'bus', 'conductor', 'transport', 'lagos', 'man laughing'], poster: 'sand', still: '4994324/pexels-photo-4994324', clip: '4994324/4994324-sd_540_960_25fps.mp4', durationSec: 14, days: 5 },
  { key: 'landlord', creator: 'chinedu', title: "Landlord's 'small increase'", description: "He says it's small. The new rent says otherwise.", category: VideoCategory.COMEDY, tags: ['rent', 'landlord', 'skit', 'filming'], poster: 'palm', still: '8360259/pexels-photo-8360259', clip: '8360259/8360259-sd_960_506_25fps.mp4', durationSec: 14, days: 18 },
  { key: 'pastor', creator: 'chinedu', title: 'POV: your driver is also a pastor', description: 'You booked a ride. You got a sermon, a prayer and a request to sow a seed.', category: VideoCategory.COMEDY, tags: ['ride', 'driver', 'church', 'pastor', 'man laughing'], poster: 'night', still: '4994037/pexels-photo-4994037', clip: '4994037/4994037-sd_960_540_25fps.mp4', durationSec: 16, days: 33 },
  { key: 'jollof', creator: 'aisha', title: 'Jollof wars: Lagos vs. Accra', description: 'Two pots, one kitchen, zero chance of agreement. Recipe for the winning pot in the caption.', category: VideoCategory.FOOD, tags: ['jollof', 'rice', 'recipe', 'ghana', 'cooking'], poster: 'ember', still: '10200319/pexels-photo-10200319', clip: '10200319/10200319-sd_540_960_25fps.mp4', durationSec: 10, days: 8, priceNaira: 4_000 },
  { key: 'suya', creator: 'aisha', title: 'Suya at midnight', description: 'Close-up grill sounds, yaji, onions and a very patient mallam. Made for food pages.', category: VideoCategory.FOOD, tags: ['suya', 'grilled meat', 'skewers', 'street food', 'night', 'asmr'], poster: 'sand', still: '35610097/pexels-photo-35610097', clip: '35610097/15091195_540_960_24fps.mp4', durationSec: 18, days: 15 },
  { key: 'puff', creator: 'aisha', title: 'Puff-puff in 10 minutes', description: "The fastest puff-puff method we've tested, start to finish in one take.", category: VideoCategory.FOOD, tags: ['snacks', 'recipe', 'eating'], poster: 'sand', still: '10200311/pexels-photo-10200311', clip: '10200311/10200311-sd_540_960_25fps.mp4', durationSec: 4, days: 50 },
  { key: 'balogun', creator: 'aisha', title: 'How to bargain at Balogun market', description: 'Start at a third of the price. Walk away once. Never show you like it.', category: VideoCategory.LIFESTYLE, tags: ['market', 'shopping', 'lagos', 'trader', 'selling food'], poster: 'palm', still: '27165163/abuja-market-african-market-bariga-market-business-woman-27165163', clip: '27165163/12087846_960_540_25fps.mp4', durationSec: 13, days: 22 },
  { key: 'shoki', creator: 'kemi', title: 'Shoki footwork in 60 seconds', description: 'Step-by-step footwork breakdown, filmed in one continuous shot.', category: VideoCategory.DANCE, tags: ['dance', 'dancing', 'tutorial', 'afrobeats', 'women'], poster: 'indigo', still: '8956007/pexels-photo-8956007', clip: '8956007/8956007-sd_540_960_25fps.mp4', durationSec: 15, days: 6, priceNaira: 8_000 },
  { key: 'owambe', creator: 'kemi', title: 'Owambe aunty seat negotiations', description: 'The VIP table is full. The aunty disagrees.', category: VideoCategory.OWAMBE, tags: ['owambe', 'party', 'aunty', 'wedding', 'dancing', 'aso oke'], poster: 'ember', still: '37964255/pexels-photo-37964255', clip: '37964255/16109125_540_960_24fps.mp4', durationSec: 28, days: 28 },
  { key: 'mc', creator: 'kemi', title: "The wedding MC who won't stop talking", description: 'The couple has been standing for 14 minutes. He has one more announcement.', category: VideoCategory.OWAMBE, tags: ['wedding', 'mc', 'bride', 'ceremony'], poster: 'sky', still: '38299946/pexels-photo-38299946', clip: '38299946/16262938_540_960_24fps.mp4', durationSec: 22, days: 37, priceNaira: 6_000, status: VideoStatus.UNDER_REVIEW },
];

const LICENCES: { number: string; video: string; buyer: string; part: LicencePart | null; duration: LicenceDuration; days: number }[] = [
  { number: 'AMI-7K3Q-92XD', video: 'pastor', buyer: 'brand', part: { startSec: 4, endSec: 14 }, duration: LicenceDuration.ONE_MONTH, days: 0 },
  { number: 'AMI-EXP2-4R8M', video: 'startup', buyer: 'blog', part: null, duration: LicenceDuration.ONE_MONTH, days: 45 },
  { number: 'AMI-H6WN-3TQA', video: 'nepa', buyer: 'brand', part: { startSec: 2, endSec: 6 }, duration: LicenceDuration.ONE_MONTH, days: 2 },
  { number: 'AMI-9FZC-RM4P', video: 'mum', buyer: 'blog', part: null, duration: LicenceDuration.FOREVER, days: 4 },
  { number: 'AMI-B2LV-8YKD', video: 'startup', buyer: 'kemi', part: null, duration: LicenceDuration.THREE_MONTHS, days: 8 },
  { number: 'AMI-T5GE-6JUS', video: 'nepa', buyer: 'chinedu', part: { startSec: 3, endSec: 8 }, duration: LicenceDuration.ONE_YEAR, days: 11 },
  { number: 'AMI-K8PR-5WXC', video: 'mum', buyer: 'aisha', part: { startSec: 5, endSec: 15 }, duration: LicenceDuration.ONE_MONTH, days: 14 },
  { number: 'AMI-Q3ZD-7MHN', video: 'nepa', buyer: 'brand', part: null, duration: LicenceDuration.ONE_MONTH, days: 20 },
  { number: 'AMI-R4TJ-2NVB', video: 'jollof', buyer: 'tolu', part: null, duration: LicenceDuration.ONE_MONTH, days: 7 },
  { number: 'AMI-W9CE-6PLK', video: 'danfo', buyer: 'blog', part: null, duration: LicenceDuration.THREE_MONTHS, days: 3 },
  { number: 'AMI-Z2HQ-8FDS', video: 'shoki', buyer: 'brand', part: { startSec: 0, endSec: 8 }, duration: LicenceDuration.ONE_MONTH, days: 5 },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set, cannot seed.');

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    models: ALL_MODELS,
    timezone: '+00:00',
    logging: false,
    define: { underscored: true, charset: 'utf8mb4' },
  });
  await sequelize.authenticate();

  if (await UserModel.findOne({ where: { email: 'tolu@demo.ami' } })) {
    console.log('Demo data is already there.');
    await sequelize.close();
    return;
  }

  const hasher = new ScryptPasswordHasher();
  const ai = new MockAiAdapter();
  const passwordHash = await hasher.hash(DEMO_PASSWORD);
  const adminPasswordHash = await hasher.hash(process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORD);

  await sequelize.transaction(async (transaction) => {
    const users = new Map<string, UserModel>();
    for (const user of USERS) {
      const created = await UserModel.create(
        {
          id: randomUUID(),
          name: user.name,
          email: user.email,
          passwordHash: user.isAdmin ? adminPasswordHash : passwordHash,
          businessName: user.businessName,
          avatarUrl: user.avatar ? face(user.avatar) : null,
          isAdmin: user.isAdmin,
          verified: user.verified,
          suspended: false,
          createdAt: ago(user.days),
        },
        { transaction },
      );
      users.set(user.key, created);
    }

    const videos = new Map<string, VideoModel>();
    for (const video of VIDEOS) {
      const creator = users.get(video.creator) as UserModel;
      const aiKeywords = await ai.videoKeywords(video);
      const [posterFrom, posterTo] = POSTERS[video.poster];
      const created = await VideoModel.create(
        {
          id: randomUUID(),
          creatorId: creator.id,
          title: video.title,
          description: video.description,
          category: video.category,
          tags: video.tags,
          aiKeywords,
          searchText: buildSearchText({ ...video, aiKeywords, creatorName: creator.name }),
          durationSec: video.durationSec,
          basePriceKobo: (video.priceNaira ?? 5_000) * 100,
          fileSha256: createHash('sha256').update(`ami-seed:${video.key}`).digest('hex'),
          fileUrl: clip(video.clip),
          fileSizeBytes: 12 * 1024 * 1024,
          previewUrl: clip(video.clip),
          thumbnailUrl: still(video.still),
          posterFrom,
          posterTo,
          status: video.status ?? VideoStatus.LIVE,
          createdAt: ago(video.days),
        },
        { transaction },
      );
      videos.set(video.key, created);
    }

    for (const [index, seed] of LICENCES.entries()) {
      const video = videos.get(seed.video) as VideoModel;
      const buyer = users.get(seed.buyer) as UserModel;
      const priceKobo = licencePriceKobo(Number(video.basePriceKobo), video.durationSec, seed.part, seed.duration);
      const { platformFeeKobo, creatorShareKobo } = splitPrice(priceKobo);
      const startsAt = new Date(ago(seed.days).getTime() - 60 * 60 * 1000);
      const endsAt = licenceEndDate(startsAt, seed.duration);
      const expired = endsAt !== null && endsAt.getTime() <= Date.now();

      const licence = await LicenceModel.create(
        {
          id: randomUUID(),
          licenceNumber: seed.number,
          videoId: video.id,
          buyerId: buyer.id,
          partStartSec: seed.part?.startSec ?? null,
          partEndSec: seed.part?.endSec ?? null,
          duration: seed.duration,
          priceKobo,
          platformFeeKobo,
          creatorShareKobo,
          status: expired ? LicenceStatus.EXPIRED : LicenceStatus.ACTIVE,
          startsAt,
          endsAt,
          createdAt: startsAt,
        },
        { transaction },
      );

      await PaymentModel.create(
        {
          id: randomUUID(),
          licenceId: licence.id,
          buyerId: buyer.id,
          reference: `AMIPAY-SEED-${1001 + index}`,
          idempotencyKey: randomUUID(),
          paymentUrl: null,
          amountKobo: priceKobo,
          feeKobo: 5_000,
          channel: 'transfer',
          status: PaymentStatus.PAID,
          paidAt: startsAt,
          bankRequestId: null,
          createdAt: startsAt,
        },
        { transaction },
      );

      await LedgerEntryModel.bulkCreate(
        [
          { id: randomUUID(), account: LedgerAccount.CREATOR, userId: video.creatorId, amountKobo: creatorShareKobo, kind: LedgerKind.SALE, licenceId: licence.id, payoutId: null, createdAt: startsAt },
          { id: randomUUID(), account: LedgerAccount.PLATFORM, userId: null, amountKobo: platformFeeKobo, kind: LedgerKind.SALE, licenceId: licence.id, payoutId: null, createdAt: startsAt },
        ],
        { transaction },
      );
    }
  });

  console.log(`Seeded ${USERS.length} users, ${VIDEOS.length} videos and ${LICENCES.length} licences.`);
  await sequelize.close();
}

await main();
