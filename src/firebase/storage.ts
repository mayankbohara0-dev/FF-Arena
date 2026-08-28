/**
 * Firebase Storage Service
 * Uploads screenshot evidence files and returns download URLs.
 */
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

/**
 * Upload a screenshot file to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadScreenshot(
  userId: string,
  tournamentId: string,
  file: File
): Promise<{ url: string; path: string }> {
  if (!isFirebaseConfigured()) {
    // Return mock URL when Firebase not configured
    return {
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format',
      path: `mock/${Date.now()}`,
    };
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `screenshots/${userId}/${tournamentId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      userId,
      tournamentId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const url = await getDownloadURL(snapshot.ref);
  return { url, path };
}

/**
 * Upload a base64/blob data URI as a screenshot.
 * Useful when using the device camera directly.
 */
export async function uploadScreenshotDataUri(
  userId: string,
  tournamentId: string,
  dataUri: string
): Promise<{ url: string; path: string }> {
  if (!isFirebaseConfigured()) {
    return {
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format',
      path: `mock/${Date.now()}`,
    };
  }

  // Convert data URI to blob
  const res = await fetch(dataUri);
  const blob = await res.blob();
  const file = new File([blob], `screenshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
  return uploadScreenshot(userId, tournamentId, file);
}

/**
 * Delete a screenshot from storage (e.g., on result rejection).
 */
export async function deleteScreenshot(path: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // File may not exist — ignore
  }
}
