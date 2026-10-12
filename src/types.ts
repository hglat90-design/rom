export type Role = 'owner' | 'manager' | 'mod' | 'trusted' | 'user';

export interface UserCapabilities {
  canDM: boolean;
  canMedia: boolean;
  canStatus: boolean;
  canChat: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  isBanned?: boolean;
  mutedUntil?: number;
  isHidden?: boolean;
  color?: string;
  glow?: string;
  nameAnim?: string;
  customBubble?: string;
  customFrame?: string;
  capabilities?: UserCapabilities;
}

export interface MessageReply {
  id: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  senderAvatar: string;
  senderColor?: string;
  senderGlow?: string;
  senderNameAnim?: string;
  senderCustomBubble?: string;
  senderCustomFrame?: string;
  text: string;
  time: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  youtubeId?: string;
  replyTo?: MessageReply;
  isAlert?: boolean;
  alertTarget?: string;
}

export interface DMMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  time: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  replyTo?: MessageReply;
  isRead: boolean;
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'media';
  content: string;
  time: string;
  timestamp: number;
  seenBy: string[]; // User IDs who viewed it
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  type: 'message' | 'user' | 'status' | 'dm';
  messageKey?: string;
  messageContent?: string;
  mediaUrl?: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'rejected';
  timestamp: number;
  resolvedAction?: string;
  resolvedComment?: string;
}

export interface WarningAlert {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  senderAvatar: string;
  targetType: 'all' | 'user' | 'role';
  targetId?: string;
  message: string;
  timestamp: number;
  readers: Record<string, number>; // userId -> timestamp read
}

export interface PendingRegistration {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AppSettings {
  verificationGateEnabled: boolean;
  autoRegistrationEnabled: boolean;
  chatMinRole: Role;
  headerBg: string;
  headerText: string;
  bottomBg: string;
  bottomText: string;
  generalBg: string;
  dmBg: string;
  generalEffect: string;
  dmEffect: string;
  arriveAnim: string;
  sendAnim: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  testers: string[];
  approvalRoles: Role[];
  approvalUsers: string[];
  nameChangeRoles: Role[];
  nameChangeUsers: string[];
  currentFontName: string;
}
