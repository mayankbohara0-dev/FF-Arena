/**
 * Cloud Firestore Notification Service — FF Arena
 * Provides real-time user notification delivery.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { NotificationDocument } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Fetches all notifications for a specific player.
 */
export async function getUserNotifications(userId: string): Promise<NotificationDocument[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as NotificationDocument);
  } catch (error) {
    console.error(`[Firebase Notifications] Error fetching notifications for user ${userId}:`, error);
    return [];
  }
}

/**
 * Real-time listener for user notifications.
 */
export function subscribeUserNotifications(
  userId: string,
  callback: (notifications: NotificationDocument[]) => void
): () => void {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifs = snapshot.docs.map((d) => d.data() as NotificationDocument);
      callback(notifs);
    },
    (error) => {
      console.error('[Firebase Notifications] Real-time subscription error:', error);
    }
  );
}

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, { read: true });
}

/**
 * Creates and delivers a notification to a specific user.
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type = 'GENERAL'
): Promise<NotificationDocument> {
  const notificationId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

  const docData: NotificationDocument = {
    notificationId,
    userId,
    title,
    body,
    type,
    read: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, docData);
  return docData;
}
