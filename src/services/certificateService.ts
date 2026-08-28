import { CertificateRecord } from '../types';

export function generateCertificateId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FF-2026-${randomPart}`;
}

export function createCertificateRecord(params: {
  userId: string;
  recipientName: string;
  recipientGameUid: string;
  recipientIgn: string;
  tournamentId: string;
  tournamentName: string;
  achievementTitle: string;
  rankAchieved: number;
  killsCount: number;
  organizerName: string;
}): CertificateRecord {
  const certificateNumber = generateCertificateId();
  return {
    id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    certificateNumber,
    certificateId: certificateNumber,
    userId: params.userId,
    recipientName: params.recipientName,
    recipientGameUid: params.recipientGameUid,
    recipientIgn: params.recipientIgn,
    tournamentId: params.tournamentId,
    tournamentName: params.tournamentName,
    rankAchieved: params.rankAchieved,
    achievementTitle: params.achievementTitle,
    killsCount: params.killsCount,
    organizerName: params.organizerName,
    issueDate: new Date().toISOString().split('T')[0],
    qrPayloadUrl: `https://ffarena.gg/verify/${certificateNumber}`,
    digitalSignatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };
}
