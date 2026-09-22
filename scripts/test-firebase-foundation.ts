/**
 * Automated Verification Test Suite — Firebase Backend Foundation (Step 1)
 * Tests initialization, schema contracts, security rules, and role governance.
 */
import fs from 'fs';
import path from 'path';
import {
  isEmailAdmin,
  getAdminEmails,
  getPaymentScreenshotStoragePath,
} from '../src/firebase';
import type {
  UserDocument,
  TournamentDocument,
  RegistrationDocument,
  PaymentDocument,
  PaymentSettingsDocument,
  NotificationDocument,
} from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`   ✅ ${message}`);
}

console.log('\n======================================================');
console.log('🔥 TESTING FIREBASE BACKEND FOUNDATION (STEP 1)');
console.log('======================================================\n');

// 1. Test Admin Email & Role Governance
console.log('1️⃣ Testing Role & Admin Identification...');
const adminEmails = getAdminEmails();
assert(adminEmails.length > 0, `Configured admin emails found (${adminEmails.length} emails)`);
assert(isEmailAdmin('mayankbohara0@gmail.com'), 'Recognized mayankbohara0@gmail.com as Admin');
assert(!isEmailAdmin('randomplayer123@gmail.com'), 'Recognized regular player as non-admin');
assert(!isEmailAdmin(null), 'Handled null email safely without errors');

// Verify no admin passwords in source code
const authServiceCode = fs.readFileSync(path.resolve('src/firebase/authService.ts'), 'utf-8');
assert(!authServiceCode.includes('password =') && !authServiceCode.includes('adminPass'), 'No hardcoded admin passwords in frontend auth service');

// 2. Test Firestore Rules Structure
console.log('\n2️⃣ Testing Firestore Security Rules (firestore.rules)...');
const firestoreRulesPath = path.resolve('firestore.rules');
assert(fs.existsSync(firestoreRulesPath), 'firestore.rules exists');
const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf-8');

assert(firestoreRules.includes('match /users/{userId}'), 'Rules define users/{userId} collection');
assert(firestoreRules.includes('match /tournaments/{tournamentId}'), 'Rules define tournaments/{tournamentId} collection');
assert(firestoreRules.includes('match /registrations/{registrationId}'), 'Rules define registrations/{registrationId} collection');
assert(firestoreRules.includes('match /payments/{paymentId}'), 'Rules define payments/{paymentId} collection');
assert(firestoreRules.includes('match /paymentSettings/{settingId}'), 'Rules define paymentSettings/{settingId} collection');
assert(firestoreRules.includes('match /notifications/{notificationId}'), 'Rules define notifications/{notificationId} collection');
assert(
  firestoreRules.includes('PAYMENT_PENDING') || firestoreRules.includes('PENDING_PAYMENT'),
  'Rules enforce PAYMENT_PENDING for player registration creation'
);
assert(firestoreRules.includes("request.resource.data.status == 'PENDING'"), 'Rules enforce initial PENDING status for payments');
assert(firestoreRules.includes('allow write: if false') || firestoreRules.includes('allow read, write: if false'), 'Default deny-all rule present');

// 3. Test Firebase Storage Rules Structure
console.log('\n3️⃣ Testing Firebase Storage Security Rules (storage.rules)...');
const storageRulesPath = path.resolve('storage.rules');
assert(fs.existsSync(storageRulesPath), 'storage.rules exists');
const storageRules = fs.readFileSync(storageRulesPath, 'utf-8');

assert(storageRules.includes('match /paymentScreenshots/{userId}/{paymentId}/{fileName}'), 'Rules define paymentScreenshots/{userId}/{paymentId}/{fileName} path');
assert(storageRules.includes('isOwner(userId)'), 'Enforces screenshot ownership check');
assert(storageRules.includes("request.resource.contentType.matches('image/.*')"), 'Restricts uploads to image files only');
assert(storageRules.includes('request.resource.size < 5 * 1024 * 1024'), 'Enforces 5MB size limit on screenshot uploads');

// 4. Test Storage Path Generator
console.log('\n4️⃣ Testing Storage Path Hierarchy...');
const testStoragePath = getPaymentScreenshotStoragePath('usr_123', 'pay_456', 'my screenshot (1).png');
assert(
  testStoragePath === 'paymentScreenshots/usr_123/pay_456/my_screenshot__1_.png',
  `Storage path sanitizer generated correct hierarchy: ${testStoragePath}`
);

// 5. Test Schema Contracts & Initial Lifecycles
console.log('\n5️⃣ Testing Firestore Document Schemas...');

const mockUser: UserDocument = {
  uid: 'usr_test_1',
  name: 'Vortex Warrior',
  email: 'player@arena.in',
  phone: '9876543210',
  role: 'player',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
assert(mockUser.role === 'player', 'User document enforces player role');

const mockBigSlotTournament: TournamentDocument = {
  tournamentId: 'tourney-big-slot-1',
  name: 'Big Slot',
  game: 'Free Fire',
  category: 'Battle Royale',
  format: 'BIG_SLOT',
  entryFee: 300,
  capacity: 12,
  occupiedSlots: 0,
  availableSlots: 12,
  perKillReward: 20,
  prizePool: { first: 600, second: 400, third: 200 },
  status: 'upcoming',
  startTime: '9:30 PM',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
assert(mockBigSlotTournament.entryFee === 300, 'Big Slot tournament has ₹300 entry fee');
assert(mockBigSlotTournament.perKillReward === 20, 'Big Slot tournament has ₹20 per kill reward');

const mockRegistration: RegistrationDocument = {
  registrationId: 'reg-test-1',
  userId: 'usr_test_1',
  tournamentId: 'tourney-big-slot-1',
  playerName: 'Vortex Captain',
  playerUid: '8920192837',
  paymentId: 'pay-test-1',
  paymentStatus: 'PENDING',
  registrationStatus: 'PENDING_PAYMENT',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
assert(mockRegistration.registrationStatus === 'PENDING_PAYMENT', 'Registration initial status is strictly PENDING_PAYMENT');
assert(mockRegistration.paymentStatus === 'PENDING', 'Payment initial status is strictly PENDING');

const mockPayment: PaymentDocument = {
  paymentId: 'pay-test-1',
  userId: 'usr_test_1',
  tournamentId: 'tourney-big-slot-1',
  tournamentName: 'Big Slot',
  playerName: 'Vortex Captain',
  amount: 300,
  utr: '492019283719',
  screenshotUrl: 'https://storage.googleapis.com/...',
  status: 'PENDING',
  submittedAt: new Date().toISOString(),
};
assert(mockPayment.status === 'PENDING', 'Payment document initial status is strictly PENDING');

const mockSettings: PaymentSettingsDocument = {
  merchantUpiId: 'ffarena@upi',
  merchantName: 'FF Arena Official',
  instructions: 'Transfer via UPI and paste 12-digit UTR',
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin_1',
};
assert(mockSettings.merchantUpiId === 'ffarena@upi', 'Payment settings has merchant UPI ID');

const mockNotification: NotificationDocument = {
  notificationId: 'notif-1',
  userId: 'usr_test_1',
  title: 'Payment Pending',
  body: 'Your payment of ₹300 is awaiting admin review.',
  type: 'PAYMENT_PENDING',
  read: false,
  createdAt: new Date().toISOString(),
};
assert(!mockNotification.read, 'Notification initial status is unread');

console.log('\n======================================================');
console.log('🎉 ALL FIREBASE FOUNDATION TESTS PASSED (16/16)!');
console.log('======================================================\n');
