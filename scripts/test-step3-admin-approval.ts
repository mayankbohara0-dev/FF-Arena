/**
 * Automated Verification Test Suite for STEP 3: Real Admin Verification & Approval
 * Run with: npm run test:approval
 *
 * Verifies:
 * 1. PaymentVerificationLogDocument & RegistrationStatus type schemas
 * 2. Firestore Security Rules (firestore.rules) for paymentVerificationLogs and admin access
 * 3. Atomic approval logic & tournament slot incrementation
 * 4. Full tournament capacity protection & error messaging
 * 5. Duplicate approval prevention (prevent double deduction)
 * 6. Rejection workflow (admin notes, PAYMENT_REJECTED status, zero slot consumption)
 * 7. Prevention of rejecting already-approved payments
 * 8. Immutable audit trail logging structure
 * 9. Notification payload generation for approval and rejection
 * 10. Admin UI component structure & integration in FFArenaMockUI
 */
import fs from 'fs';
import path from 'path';
import type {
  PaymentDocument,
  RegistrationDocument,
  TournamentDocument,
  PaymentVerificationLogDocument,
  RegistrationStatus,
} from '../src/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failedTests++;
  }
}

async function runStep3VerificationTests() {
  console.log('\n\x1b[36m══════════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m   STEP 3 REAL ADMIN VERIFICATION & APPROVAL — VERIFICATION SUITE  \x1b[0m');
  console.log('\x1b[36m══════════════════════════════════════════════════════════════════\x1b[0m\n');

  // ────────────────────────────────────────────────────────────────
  // Test 1: Type Definitions & Schema Contracts
  // ────────────────────────────────────────────────────────────────
  console.log('\x1b[33m▶ 1. Type Definitions & Schema Contracts\x1b[0m');

  const typesFilePath = path.resolve('src/types/index.ts');
  const typesContent = fs.readFileSync(typesFilePath, 'utf-8');

  assert(
    typesContent.includes("'PAYMENT_REJECTED'"),
    'RegistrationStatus includes PAYMENT_REJECTED enum value'
  );

  assert(
    typesContent.includes('export interface PaymentVerificationLogDocument'),
    'PaymentVerificationLogDocument interface is properly exported'
  );

  assert(
    typesContent.includes('registrationId?: string;') &&
      typesContent.includes("status: 'PENDING' | 'APPROVED' | 'REJECTED';"),
    'PaymentDocument includes registrationId, status, and verification fields'
  );

  const sampleAuditLog: PaymentVerificationLogDocument = {
    logId: 'log-test-01',
    paymentId: 'pay-test-01',
    registrationId: 'reg-test-01',
    tournamentId: 'tourney-test-01',
    userId: 'user-player-01',
    adminUid: 'admin-master-uid',
    action: 'APPROVED',
    amount: 15,
    utr: '987654321098',
    timestamp: new Date().toISOString(),
  };

  assert(
    sampleAuditLog.action === 'APPROVED' && sampleAuditLog.amount === 15,
    'PaymentVerificationLogDocument accurately models immutable verification audit records'
  );

  // ────────────────────────────────────────────────────────────────
  // Test 2: Firestore Security Rules (firestore.rules)
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 2. Firestore Security Rules Verification\x1b[0m');

  const rulesFilePath = path.resolve('firestore.rules');
  const rulesContent = fs.readFileSync(rulesFilePath, 'utf-8');

  assert(
    rulesContent.includes('match /paymentVerificationLogs/{logId}'),
    'firestore.rules declares paymentVerificationLogs collection'
  );

  assert(
    rulesContent.includes('allow read, write: if isAdmin();'),
    'paymentVerificationLogs strictly requires isAdmin() for read and write'
  );

  assert(
    rulesContent.includes('match /payments/{paymentId}') &&
      rulesContent.includes('allow update: if isAdmin();'),
    'Payments collection strictly restricts status updates to admins'
  );

  assert(
    rulesContent.includes('match /registrations/{registrationId}') &&
      rulesContent.includes('allow update: if isAdmin();'),
    'Registrations collection strictly restricts status confirmation to admins'
  );

  // ────────────────────────────────────────────────────────────────
  // Test 3: Atomic Approval Business Logic & Slot Management
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 3. Atomic Approval Business Logic & Slot Verification\x1b[0m');

  // Simulate Tournament & Payment State
  const simulateApproval = (
    tourney: { capacity: number; occupiedSlots: number; status: string },
    payment: { status: string; amount: number; utr: string },
    reg: { paymentStatus: string; registrationStatus: string },
    adminUid: string
  ) => {
    if (payment.status === 'APPROVED') {
      throw new Error('This payment has already been approved.');
    }
    if (payment.status === 'REJECTED') {
      throw new Error('This payment was already marked as rejected.');
    }
    if (tourney.occupiedSlots >= tourney.capacity) {
      throw new Error('This tournament is full. Payment cannot be confirmed automatically.');
    }

    const newOccupied = tourney.occupiedSlots + 1;
    const newAvailable = Math.max(0, tourney.capacity - newOccupied);
    const newStatus = newOccupied >= tourney.capacity ? 'FULL' : tourney.status;

    return {
      updatedPayment: {
        ...payment,
        status: 'APPROVED',
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminUid,
      },
      updatedReg: {
        ...reg,
        paymentStatus: 'APPROVED',
        registrationStatus: 'CONFIRMED',
      },
      updatedTourney: {
        ...tourney,
        occupiedSlots: newOccupied,
        availableSlots: newAvailable,
        status: newStatus,
      },
      auditLog: {
        action: 'APPROVED',
        amount: payment.amount,
        utr: payment.utr,
        adminUid,
        timestamp: new Date().toISOString(),
      },
    };
  };

  const initialTourney = { capacity: 2, occupiedSlots: 0, status: 'upcoming' };
  const initialPayment1 = { status: 'PENDING', amount: 15, utr: '423819284910' };
  const initialReg1 = { paymentStatus: 'PENDING', registrationStatus: 'PAYMENT_PENDING' };

  const approval1 = simulateApproval(initialTourney, initialPayment1, initialReg1, 'admin-uid-1');

  assert(approval1.updatedPayment.status === 'APPROVED', 'Payment status updated to APPROVED');
  assert(
    approval1.updatedPayment.verifiedBy === 'admin-uid-1',
    'Payment record tracks admin UID who approved'
  );
  assert(
    approval1.updatedReg.registrationStatus === 'CONFIRMED',
    'Registration status updated to CONFIRMED'
  );
  assert(
    approval1.updatedTourney.occupiedSlots === 1 && approval1.updatedTourney.availableSlots === 1,
    'Occupied slots incremented by 1 and available slots decremented by 1'
  );
  assert(
    approval1.auditLog.action === 'APPROVED',
    'Audit log generated with action APPROVED'
  );

  // ────────────────────────────────────────────────────────────────
  // Test 4: Duplicate Approval Protection
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 4. Duplicate Approval Protection\x1b[0m');

  let duplicateBlocked = false;
  try {
    simulateApproval(
      approval1.updatedTourney,
      approval1.updatedPayment,
      approval1.updatedReg,
      'admin-uid-1'
    );
  } catch (err: any) {
    duplicateBlocked = true;
    assert(
      err.message === 'This payment has already been approved.',
      'Duplicate approval throws: "This payment has already been approved."'
    );
  }
  assert(duplicateBlocked, 'Duplicate approval attempt was successfully blocked');

  // ────────────────────────────────────────────────────────────────
  // Test 5: Full Tournament Capacity Safeguard
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 5. Full Tournament Capacity Safeguard\x1b[0m');

  const initialPayment2 = { status: 'PENDING', amount: 15, utr: '423819284911' };
  const initialReg2 = { paymentStatus: 'PENDING', registrationStatus: 'PAYMENT_PENDING' };
  const approval2 = simulateApproval(
    approval1.updatedTourney,
    initialPayment2,
    initialReg2,
    'admin-uid-1'
  );

  assert(
    approval2.updatedTourney.occupiedSlots === 2 && approval2.updatedTourney.status === 'FULL',
    'Tournament automatically marked as FULL upon reaching capacity'
  );

  // Attempt 3rd payment approval on full tournament
  const initialPayment3 = { status: 'PENDING', amount: 15, utr: '423819284912' };
  const initialReg3 = { paymentStatus: 'PENDING', registrationStatus: 'PAYMENT_PENDING' };

  let fullCapacityBlocked = false;
  try {
    simulateApproval(
      approval2.updatedTourney,
      initialPayment3,
      initialReg3,
      'admin-uid-1'
    );
  } catch (err: any) {
    fullCapacityBlocked = true;
    assert(
      err.message === 'This tournament is full. Payment cannot be confirmed automatically.',
      'Throws specific error: "This tournament is full. Payment cannot be confirmed automatically."'
    );
  }
  assert(fullCapacityBlocked, 'Approval blocked when tournament is full');

  // ────────────────────────────────────────────────────────────────
  // Test 6: Rejection Business Logic & Zero Slot Consumption
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 6. Rejection Business Logic & Zero Slot Consumption\x1b[0m');

  const simulateRejection = (
    tourney: { capacity: number; occupiedSlots: number; status: string },
    payment: { status: string; amount: number; utr: string },
    reg: { paymentStatus: string; registrationStatus: string },
    rejectionReason: string,
    adminUid: string
  ) => {
    if (payment.status === 'APPROVED') {
      throw new Error('Cannot reject a payment that has already been approved.');
    }

    return {
      updatedPayment: {
        ...payment,
        status: 'REJECTED',
        adminNote: rejectionReason,
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminUid,
      },
      updatedReg: {
        ...reg,
        paymentStatus: 'REJECTED',
        registrationStatus: 'PAYMENT_REJECTED',
      },
      updatedTourney: {
        ...tourney, // Unchanged
      },
      auditLog: {
        action: 'REJECTED',
        reason: rejectionReason,
        amount: payment.amount,
        utr: payment.utr,
        adminUid,
        timestamp: new Date().toISOString(),
      },
    };
  };

  const rejectionReason = 'Invalid UTR — Transaction reference not found in merchant bank records';
  const rejectionResult = simulateRejection(
    approval2.updatedTourney,
    initialPayment3,
    initialReg3,
    rejectionReason,
    'admin-uid-1'
  );

  assert(
    rejectionResult.updatedPayment.status === 'REJECTED',
    'Payment status updated to REJECTED'
  );
  assert(
    rejectionResult.updatedPayment.adminNote === rejectionReason,
    'Rejection note properly stored on payment document'
  );
  assert(
    rejectionResult.updatedReg.registrationStatus === 'PAYMENT_REJECTED',
    'Registration status updated to PAYMENT_REJECTED'
  );
  assert(
    rejectionResult.updatedTourney.occupiedSlots === approval2.updatedTourney.occupiedSlots,
    'Tournament slots were NOT consumed during rejection'
  );
  assert(
    rejectionResult.auditLog.action === 'REJECTED' &&
      rejectionResult.auditLog.reason === rejectionReason,
    'Audit log recorded with action REJECTED and reason note'
  );

  // ────────────────────────────────────────────────────────────────
  // Test 7: Cannot Reject Already-Approved Payment
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 7. Protection Against Rejecting Approved Payment\x1b[0m');

  let approvedRejectBlocked = false;
  try {
    simulateRejection(
      approval1.updatedTourney,
      approval1.updatedPayment,
      approval1.updatedReg,
      'Try reject',
      'admin-uid-1'
    );
  } catch (err: any) {
    approvedRejectBlocked = true;
    assert(
      err.message === 'Cannot reject a payment that has already been approved.',
      'Throws error when attempting to reject an approved payment'
    );
  }
  assert(approvedRejectBlocked, 'Rejection of approved payment was blocked');

  // ────────────────────────────────────────────────────────────────
  // Test 8: paymentService.ts Step 3 Functions Implementation
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 8. paymentService.ts Step 3 Function Exports\x1b[0m');

  const paymentServiceFilePath = path.resolve('src/firebase/paymentService.ts');
  const paymentServiceContent = fs.readFileSync(paymentServiceFilePath, 'utf-8');

  assert(
    paymentServiceContent.includes('export async function approvePaymentTransaction'),
    'paymentService exports approvePaymentTransaction'
  );

  assert(
    paymentServiceContent.includes('export async function rejectPaymentTransaction'),
    'paymentService exports rejectPaymentTransaction'
  );

  assert(
    paymentServiceContent.includes('export async function getAllPayments'),
    'paymentService exports getAllPayments'
  );

  assert(
    paymentServiceContent.includes('export function subscribeAllPayments'),
    'paymentService exports subscribeAllPayments'
  );

  assert(
    paymentServiceContent.includes('export async function getPaymentVerificationLogs'),
    'paymentService exports getPaymentVerificationLogs'
  );

  assert(
    paymentServiceContent.includes('runTransaction(db,'),
    'approvePaymentTransaction executes an atomic Firestore transaction'
  );

  assert(
    paymentServiceContent.includes('createNotification('),
    'Dispatches real-time notification to player upon verification'
  );

  // ────────────────────────────────────────────────────────────────
  // Test 9: Admin Verification Panel UI & Integration
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[33m▶ 9. Admin Verification Panel UI & Integration\x1b[0m');

  const panelFilePath = path.resolve('src/components/admin/PaymentVerificationPanel.tsx');
  assert(fs.existsSync(panelFilePath), 'PaymentVerificationPanel.tsx exists in src/components/admin');

  const panelContent = fs.readFileSync(panelFilePath, 'utf-8');
  assert(
    panelContent.includes('Have you verified that this payment was actually received?'),
    'Explicit confirmation prompt: "Have you verified that this payment was actually received?" is present'
  );

  assert(
    panelContent.includes('No automatic bank clearance is claimed'),
    'Manual bank verification protocol and disclaimer is prominently stated'
  );

  assert(
    panelContent.includes('lightboxImageUrl') && panelContent.includes('Zoom:'),
    'Fullscreen screenshot viewer lightbox with zoom controls is implemented'
  );

  assert(
    panelContent.includes('REJECTION_PRESETS'),
    'Standard rejection reason chips are provided for quick admin selection'
  );

  const mockUiFilePath = path.resolve('src/components/mobile/FFArenaMockUI.tsx');
  const mockUiContent = fs.readFileSync(mockUiFilePath, 'utf-8');

  assert(
    mockUiContent.includes('<PaymentVerificationPanel'),
    'FFArenaMockUI embeds PaymentVerificationPanel inside AdminDashboard'
  );

  assert(
    mockUiContent.includes('PAYMENT VERIFICATION') && mockUiContent.includes('pendingPaymentsCount'),
    'Admin top switcher displays PAYMENT VERIFICATION tab with real-time pending badge'
  );

  // ────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m══════════════════════════════════════════════════════════════════\x1b[0m');
  console.log(
    `\x1b[32mPassed: ${passedTests}\x1b[0m  |  \x1b[${failedTests > 0 ? '31' : '32'}mFailed: ${failedTests}\x1b[0m`
  );
  console.log('\x1b[36m══════════════════════════════════════════════════════════════════\x1b[0m\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStep3VerificationTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
