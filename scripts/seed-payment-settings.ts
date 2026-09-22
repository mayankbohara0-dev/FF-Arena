/**
 * Seed or Update Firestore Merchant Payment Settings
 * Path: paymentSettings/default
 *
 * Usage:
 *   npx tsx scripts/seed-payment-settings.ts
 *
 * Configures:
 * - upiId
 * - qrImageUrl
 * - instructions
 * - enabled
 */
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase/config';
import type { PaymentSettingsDocument } from '../src/types';

async function seedPaymentSettings() {
  console.log('\n⚙️ Configuring Firestore paymentSettings/default...');

  const settingsDocRef = doc(db, 'paymentSettings', 'default');

  const defaultSettings: PaymentSettingsDocument = {
    upiId: process.env.VITE_MERCHANT_UPI_ID || 'ffarena@upi',
    qrImageUrl:
      process.env.VITE_MERCHANT_QR_URL ||
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dffarena%40upi%26pn%3DFF%2520Arena%2520Esports',
    instructions:
      '1. Pay the exact tournament entry fee using any UPI App (GPay, PhonePe, Paytm, BHIM).\n2. Note down the 12-digit UTR / UPI Reference Number from your payment confirmation screen.\n3. Take a screenshot of the completed payment receipt.\n4. Upload the screenshot and submit the 12-digit UTR below for admin manual verification.',
    enabled: true,
    merchantName: 'FF Arena Official Esports India',
    merchantUpiId: process.env.VITE_MERCHANT_UPI_ID || 'ffarena@upi',
    qrCodeUrl:
      process.env.VITE_MERCHANT_QR_URL ||
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dffarena%40upi%26pn%3DFF%2520Arena%2520Esports',
    updatedAt: serverTimestamp(),
    updatedBy: 'admin',
  };

  try {
    await setDoc(settingsDocRef, defaultSettings, { merge: true });
    console.log('✅ paymentSettings/default successfully configured in Firestore!');
    console.log('   UPI ID:', defaultSettings.upiId);
    console.log('   QR URL:', defaultSettings.qrImageUrl);
    console.log('   Status: enabled =', defaultSettings.enabled);
  } catch (err: any) {
    console.error('❌ Failed to update paymentSettings/default:', err.message);
  }
}

seedPaymentSettings();
