import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, Database } from 'firebase/database';
import { ChatMessage, DMMessage, StatusItem, ReportItem, WarningAlert, AppSettings, User } from './types';
import { saveMessages, saveDMMessages, saveStatuses, saveReports, saveWarnings, saveSettings, saveUsers, getMessages, getDMMessages, getStatuses, getReports, getWarnings, getSettings, getUsers } from './storage';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY_FB = 'veysi_firebase_config';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyVeysiProChat2026MasterKey',
  authDomain: 'veysi-pro-chat.firebaseapp.com',
  databaseURL: 'https://veysi-pro-chat-default-rtdb.firebaseio.com',
  projectId: 'veysi-pro-chat',
  storageBucket: 'veysi-pro-chat.appspot.com',
};

let firebaseApp: FirebaseApp | null = null;
let firebaseDb: Database | null = null;
let isConnected = false;

export function getSavedFirebaseConfig(): FirebaseConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY_FB);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.databaseURL) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_FB, JSON.stringify(config));
    return initFirebase(config);
  } catch (err) {
    console.error('Failed to save firebase config', err);
    return false;
  }
}

export function isFirebaseActive(): boolean {
  return isConnected && firebaseDb !== null;
}

export function initFirebase(customConfig?: FirebaseConfig): boolean {
  try {
    const config = customConfig || getSavedFirebaseConfig();
    if (!config || !config.databaseURL) {
      isConnected = false;
      return false;
    }

    const apps = getApps();
    if (apps.length === 0) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey || 'AIzaSyVeysiPro2026',
        databaseURL: config.databaseURL,
        projectId: config.projectId || 'veysi-pro-chat',
      });
    } else {
      firebaseApp = apps[0];
    }

    firebaseDb = getDatabase(firebaseApp, config.databaseURL);
    isConnected = true;

    // Attach real-time listeners safely
    attachRealtimeListeners(firebaseDb);
    return true;
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    isConnected = false;
    return false;
  }
}

function attachRealtimeListeners(db: Database) {
  // 1. Messages Listener
  try {
    const messagesRef = ref(db, 'chat_messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgsList: ChatMessage[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);

        saveMessages(msgsList);
      }
    }, (error) => {
      console.warn('Firebase messages sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase messages listener error', e);
  }

  // 2. Direct Messages Listener
  try {
    const dmRef = ref(db, 'direct_messages');
    onValue(dmRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dmsList: DMMessage[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);

        saveDMMessages(dmsList);
      }
    }, (error) => {
      console.warn('Firebase DMs sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase DM listener error', e);
  }

  // 3. Statuses Listener
  try {
    const statusRef = ref(db, 'statuses');
    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const statusList: StatusItem[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        saveStatuses(statusList);
      }
    }, (error) => {
      console.warn('Firebase status sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase status listener error', e);
  }

  // 4. Users Listener
  try {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        saveUsers(usersList);
      }
    }, (error) => {
      console.warn('Firebase users sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase users listener error', e);
  }

  // 5. Warnings Listener
  try {
    const warnRef = ref(db, 'warnings');
    onValue(warnRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const warnList: WarningAlert[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        saveWarnings(warnList);
      }
    }, (error) => {
      console.warn('Firebase warnings sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase warnings listener error', e);
  }

  // 6. Reports Listener
  try {
    const repRef = ref(db, 'reports');
    onValue(repRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const repList: ReportItem[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        saveReports(repList);
      }
    }, (error) => {
      console.warn('Firebase reports sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase reports listener error', e);
  }

  // 7. Settings Listener
  try {
    const settingsRef = ref(db, 'app_settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        saveSettings(data);
      }
    }, (error) => {
      console.warn('Firebase settings sync fallback to local', error);
    });
  } catch (e) {
    console.warn('Firebase settings listener error', e);
  }
}

// Writers to Firebase
export function syncMessageToFirebase(msg: ChatMessage): void {
  if (firebaseDb) {
    try {
      const messagesRef = ref(firebaseDb, `chat_messages/${msg.id}`);
      set(messagesRef, msg);
    } catch (e) {
      console.warn('Failed to push message to firebase', e);
    }
  }
}

export function syncDMToFirebase(dm: DMMessage): void {
  if (firebaseDb) {
    try {
      const dmRef = ref(firebaseDb, `direct_messages/${dm.id}`);
      set(dmRef, dm);
    } catch (e) {
      console.warn('Failed to push DM to firebase', e);
    }
  }
}

export function syncStatusToFirebase(status: StatusItem): void {
  if (firebaseDb) {
    try {
      const statusRef = ref(firebaseDb, `statuses/${status.id}`);
      set(statusRef, status);
    } catch (e) {
      console.warn('Failed to push status to firebase', e);
    }
  }
}

export function syncUserToFirebase(user: User): void {
  if (firebaseDb) {
    try {
      const userRef = ref(firebaseDb, `users/${user.id}`);
      set(userRef, user);
    } catch (e) {
      console.warn('Failed to sync user to firebase', e);
    }
  }
}

export function syncWarningToFirebase(warn: WarningAlert): void {
  if (firebaseDb) {
    try {
      const warnRef = ref(firebaseDb, `warnings/${warn.id}`);
      set(warnRef, warn);
    } catch (e) {
      console.warn('Failed to sync warning to firebase', e);
    }
  }
}

export function syncReportToFirebase(report: ReportItem): void {
  if (firebaseDb) {
    try {
      const reportRef = ref(firebaseDb, `reports/${report.id}`);
      set(reportRef, report);
    } catch (e) {
      console.warn('Failed to sync report to firebase', e);
    }
  }
}

export function syncSettingsToFirebase(settings: AppSettings): void {
  if (firebaseDb) {
    try {
      const settingsRef = ref(firebaseDb, 'app_settings');
      set(settingsRef, settings);
    } catch (e) {
      console.warn('Failed to sync settings to firebase', e);
    }
  }
}
