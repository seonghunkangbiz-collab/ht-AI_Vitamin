// lib/reveal-day/local-video-storage.ts
// Pure browser-local IndexedDB storage for large video files (0 network upload, no size limit, instant local playback)

const DB_NAME = 'ai_vitamin_db';
const DB_VERSION = 1;
const STORE_NAME = 'reveal_videos';
const VIDEO_KEY = 'reveal_day_video';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalVideoToDB(file: File): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(file, VIDEO_KEY);
    putReq.onsuccess = () => {
      const blobUrl = URL.createObjectURL(file);
      resolve(blobUrl);
    };
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getLocalVideoFromDB(): Promise<{ file: File; blobUrl: string; name: string } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(VIDEO_KEY);
      getReq.onsuccess = () => {
        const file = getReq.result as File | undefined;
        if (!file) {
          return resolve(null);
        }
        const blobUrl = URL.createObjectURL(file);
        resolve({ file, blobUrl, name: file.name });
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return null;
  }
}

export async function clearLocalVideoFromDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(VIDEO_KEY);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
  } catch {}
}
