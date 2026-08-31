import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, AttendanceRecord, AppSettings, BKNote } from '../types';

// Initialize Firebase App instance safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if specified
export const db: Firestore = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  SETTINGS: 'settings',
  BK_NOTES: 'bk_notes',
};

// Sync State Tracker for UI indicators
export type CloudSyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

interface SyncState {
  status: CloudSyncStatus;
  lastSyncedAt: Date | null;
  activeListenersCount: number;
  errorMessage?: string;
}

let syncState: SyncState = {
  status: 'syncing',
  lastSyncedAt: null,
  activeListenersCount: 0,
};

type SyncListener = (state: SyncState) => void;
const syncListeners: Set<SyncListener> = new Set();

export function subscribeToSyncStatus(listener: SyncListener) {
  syncListeners.add(listener);
  listener(syncState);
  return () => {
    syncListeners.delete(listener);
  };
}

export function updateSyncState(patch: Partial<SyncState>) {
  syncState = { ...syncState, ...patch };
  syncListeners.forEach((l) => {
    try {
      l(syncState);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });
}

export function getSyncState(): SyncState {
  return syncState;
}
