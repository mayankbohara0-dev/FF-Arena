/**
 * One-time Firestore seeder script
 * Run with: npx tsx scripts/seedFirestore.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SEED_TOURNAMENTS = [
  {
    name: 'Bermuda 48P Flash Blitz #101',
    slug: 'bermuda-48p-flash-blitz-101',
    description: 'Official 48-player Free Fire MAX battle royale tournament. ₹15 entry fee, ₹10/kill bounty + ₹20 extra for Booyah!',
    game: 'Free Fire MAX',
    gameVersion: 'OB48 Latest',
    mode: 'Battle Royale',
    format: 'Solo (48 Players)',
    matchMode: 'SOLO',
    teamSize: 1,
    map: 'Bermuda',
    entryFee: 15,
    perKillReward: 10,
    prizePool: 530,
    maxParticipants: 48,
    currentParticipants: 42,
    status: 'Registration Open',
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    rules: ['₹15 Entry Fee', '48 Slots Max', 'No Emulators', '₹10/Kill + ₹20 Booyah Bonus'],
    rewardDescription: '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    roomId: '8391047',
    roomPassword: 'arenaff2026',
    isRoomReleased: false,
  },
  {
    name: 'Purgatory Duo Warfare #88',
    slug: 'purgatory-duo-warfare-88',
    description: '24 Duos (48 total players) drop into Purgatory. Win ₹10/kill bounty and instant UPI payout!',
    game: 'Free Fire MAX',
    gameVersion: 'OB48 Latest',
    mode: 'Battle Royale',
    format: 'Duo (24 Teams / 48 Slots)',
    matchMode: 'DUO',
    teamSize: 2,
    map: 'Purgatory',
    entryFee: 15,
    perKillReward: 10,
    prizePool: 530,
    maxParticipants: 48,
    currentParticipants: 36,
    status: 'Registration Open',
    startTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    rules: ['₹15 Entry Fee', '48 Slots Max', 'No Emulators', '₹10/Kill + ₹20 Booyah Bonus'],
    rewardDescription: '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    roomId: '7729103',
    roomPassword: 'ffduo2026',
    isRoomReleased: false,
  },
  {
    name: 'Kalahari Squad Clash Championship',
    slug: 'kalahari-squad-clash-championship',
    description: '12 Squads (48 total players) in high-stakes desert warfare. Full team rewards and certificates.',
    game: 'Free Fire MAX',
    gameVersion: 'OB48 Latest',
    mode: 'Battle Royale',
    format: 'Squad (12 Teams / 48 Slots)',
    matchMode: 'SQUAD',
    teamSize: 4,
    map: 'Kalahari',
    entryFee: 15,
    perKillReward: 10,
    prizePool: 530,
    maxParticipants: 48,
    currentParticipants: 48,
    status: 'Live',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    rules: ['₹15 Entry Fee', '48 Slots Max', 'No Emulators', '₹10/Kill + ₹20 Booyah Bonus'],
    rewardDescription: '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    roomId: '9920148',
    roomPassword: 'kalahari2026',
    isRoomReleased: true,
  }
];

async function seed() {
  console.log('Seeding initial 48-player tournaments into Firestore...');
  for (const t of SEED_TOURNAMENTS) {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...t,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✓ Added tournament: ${t.name} (ID: ${docRef.id})`);
  }
  console.log('Done!');
}

seed().catch(console.error);
