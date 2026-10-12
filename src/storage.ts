import { AppSettings, ChatMessage, DMMessage, PendingRegistration, ReportItem, StatusItem, User, WarningAlert } from './types';

const STORAGE_KEYS = {
  CURRENT_USER: 'veysi_current_user',
  USERS: 'veysi_users_list',
  MESSAGES: 'veysi_chat_messages',
  DM_MESSAGES: 'veysi_dm_messages',
  STATUSES: 'veysi_statuses',
  REPORTS: 'veysi_reports',
  WARNINGS: 'veysi_warnings',
  PENDING_REGS: 'veysi_pending_regs',
  SETTINGS: 'veysi_settings',
  DEVICE_ID: 'veysi_device_id',
};

const broadcastChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('veysi_pro_realtime_bus')
  : null;

// Initial Default Application Settings
export const DEFAULT_SETTINGS: AppSettings = {
  verificationGateEnabled: true,
  autoRegistrationEnabled: true,
  chatMinRole: 'user',
  headerBg: '#008069',
  headerText: '#ffffff',
  bottomBg: '#ffffff',
  bottomText: '#666666',
  generalBg: '',
  dmBg: '',
  generalEffect: 'none',
  dmEffect: 'none',
  arriveAnim: 'fadeSlideIn',
  sendAnim: 'sendPop',
  maintenanceMode: false,
  maintenanceMessage: 'التطبيق تحت الصيانة المؤقتة، يرجى المحاولة لاحقاً.',
  testers: [],
  approvalRoles: ['owner', 'manager'],
  approvalUsers: [],
  nameChangeRoles: ['owner'],
  nameChangeUsers: [],
  currentFontName: 'الخط الافتراضي (سلطان بلاك)',
};

// Seed sample team members if empty
const DEFAULT_USERS: User[] = [
  {
    id: 'user_owner_001',
    name: 'المالك فيسي 👑',
    phone: '+966500000001',
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'online',
    lastSeen: Date.now(),
    color: '#FFD700',
    glow: 'gold',
    nameAnim: 'name-anim-gold',
    customBubble: 'king',
    customFrame: 'king',
    capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
  },
  {
    id: 'user_manager_002',
    name: 'المدير سامر 💎',
    phone: '+966500000002',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'online',
    lastSeen: Date.now(),
    color: '#9C27B0',
    nameAnim: 'name-anim-shine',
    capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
  },
  {
    id: 'user_mod_003',
    name: 'المشرف أحمد 🛡️',
    phone: '+966500000003',
    role: 'mod',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    status: 'online',
    lastSeen: Date.now(),
    capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
  },
  {
    id: 'user_trusted_004',
    name: 'سارة العتيبي ✅',
    phone: '+966500000004',
    role: 'trusted',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'online',
    lastSeen: Date.now(),
    capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome_1',
    senderId: 'user_owner_001',
    senderName: 'المالك فيسي 👑',
    senderRole: 'owner',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    senderColor: '#FFD700',
    senderGlow: 'gold',
    senderNameAnim: 'name-anim-gold',
    senderCustomBubble: 'king',
    senderCustomFrame: 'king',
    text: 'أهلاً بكم في النسخة المطورة من فيسي برو (Veysi Pro) 🚀 نظام دردشة فائق السرعة مع أمان متقدم.',
    time: '12:00 م',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'msg_welcome_2',
    senderId: 'user_manager_002',
    senderName: 'المدير سامر 💎',
    senderRole: 'manager',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    text: 'نظام البلاغات والرسائل الخاصة والحالات وتخصيص المظهر يعمل بكفاءة 100%.',
    time: '12:05 م',
    timestamp: Date.now() - 3000000,
  }
];

export function getDeviceId(): string {
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // also update or add to user list
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveUsers(users);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  broadcastChange('user_updated', user);
}

export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  broadcastChange('users_updated', users);
}

export function getMessages(): ChatMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(DEFAULT_MESSAGES));
      return DEFAULT_MESSAGES;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_MESSAGES;
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  broadcastChange('messages_updated', messages);
}

export function addMessage(msg: ChatMessage): void {
  const messages = getMessages();
  messages.push(msg);
  saveMessages(messages);
  import('./firebase').then(fb => fb.syncMessageToFirebase(msg)).catch(() => {});
}

export function getDMMessages(): DMMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DM_MESSAGES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDMMessages(messages: DMMessage[]): void {
  localStorage.setItem(STORAGE_KEYS.DM_MESSAGES, JSON.stringify(messages));
  broadcastChange('dm_updated', messages);
}

export function addDMMessage(msg: DMMessage): void {
  const dms = getDMMessages();
  dms.push(msg);
  saveDMMessages(dms);
  import('./firebase').then(fb => fb.syncDMToFirebase(msg)).catch(() => {});
}

export function getStatuses(): StatusItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATUSES);
    const list: StatusItem[] = data ? JSON.parse(data) : [];
    // Filter statuses older than 24 hours
    const now = Date.now();
    return list.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
  } catch {
    return [];
  }
}

export function saveStatuses(statuses: StatusItem[]): void {
  localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
  broadcastChange('statuses_updated', statuses);
}

export function addStatus(status: StatusItem): void {
  const all = getStatuses();
  all.push(status);
  saveStatuses(all);
  import('./firebase').then(fb => fb.syncStatusToFirebase(status)).catch(() => {});
}

export function getReports(): ReportItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveReports(reports: ReportItem[]): void {
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  broadcastChange('reports_updated', reports);
}

export function addReport(report: ReportItem): void {
  const reports = getReports();
  reports.unshift(report);
  saveReports(reports);
  import('./firebase').then(fb => fb.syncReportToFirebase(report)).catch(() => {});
}

export function getWarnings(): WarningAlert[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WARNINGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWarnings(warnings: WarningAlert[]): void {
  localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify(warnings));
  broadcastChange('warnings_updated', warnings);
}

export function addWarning(warn: WarningAlert): void {
  const warnings = getWarnings();
  warnings.unshift(warn);
  saveWarnings(warnings);
  import('./firebase').then(fb => fb.syncWarningToFirebase(warn)).catch(() => {});
}

export function getPendingRegistrations(): PendingRegistration[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_REGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePendingRegistrations(list: PendingRegistration[]): void {
  localStorage.setItem(STORAGE_KEYS.PENDING_REGS, JSON.stringify(list));
  broadcastChange('pending_regs_updated', list);
}

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  broadcastChange('settings_updated', settings);
}

// Cross-tab Synchronization
function broadcastChange(type: string, payload: unknown) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload });
    } catch {
      // broadcast fail fallback
    }
  }
}

export function onRealtimeEvent(callback: (type: string, payload: unknown) => void): void {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type) {
        callback(event.data.type, event.data.payload);
      }
    };
  }
}
