import { DMMessage, MessageReply, User } from './types';
import { addDMMessage, getCurrentUser, getDMMessages, getUsers, saveDMMessages } from './storage';
import { playMessageSentSound, playMessageReceivedSound } from './audio';
import { formatTime } from './chat';

let activeDMUserId: string | null = null;
let activeDMReply: MessageReply | null = null;

export function getActiveDMUserId(): string | null {
  return activeDMUserId;
}

export function setActiveDMUserId(userId: string | null): void {
  activeDMUserId = userId;
  if (userId) {
    markDMsAsRead(userId);
  }
}

export function openDMChatWith(userId: string): void {
  const users = getUsers();
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) return;

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.capabilities && currentUser.capabilities.canDM === false) {
    alert('تم إيقاف صلاحية الرسائل الخاصة لحسابك من قِبل الإدارة.');
    return;
  }

  setActiveDMUserId(userId);

  const modal = document.getElementById('dm-chat-modal');
  const avatarEl = document.getElementById('dm-chat-avatar') as HTMLImageElement;
  const nameEl = document.getElementById('dm-chat-name');
  const roleEl = document.getElementById('dm-chat-role');

  if (avatarEl) avatarEl.src = targetUser.avatar;
  if (nameEl) nameEl.textContent = targetUser.name;
  if (roleEl) roleEl.textContent = getRoleTitle(targetUser.role);

  if (modal) {
    modal.classList.add('active');
  }

  renderActiveDMMessages();
}

export function closeDMChat(): void {
  const modal = document.getElementById('dm-chat-modal');
  if (modal) modal.classList.remove('active');
  setActiveDMUserId(null);
  activeDMReply = null;
  updateDMReplyBarUI();
}

export function renderDMUsersList(searchQuery = ''): void {
  const container = document.getElementById('dm-users-list');
  if (!container) return;

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const users = getUsers().filter(u => u.id !== currentUser.id && !u.isHidden);
  const dmMessages = getDMMessages();

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">لا يوجد مستخدمون</div>';
    return;
  }

  filtered.forEach(user => {
    // Find unread count from this user to current user
    const unreadCount = dmMessages.filter(
      m => m.fromId === user.id && m.toId === currentUser.id && !m.isRead
    ).length;

    // Last message between these two
    const convMsgs = dmMessages.filter(
      m => (m.fromId === user.id && m.toId === currentUser.id) ||
           (m.fromId === currentUser.id && m.toId === user.id)
    ).sort((a, b) => b.timestamp - a.timestamp);

    const lastMsg = convMsgs[0];
    const lastMsgText = lastMsg ? (lastMsg.mediaUrl ? '📎 وسائط' : lastMsg.text) : 'انقر لبدء المحادثة';

    const card = document.createElement('div');
    card.className = 'dm-user-card';
    card.onclick = () => {
      // Close dm list and open dm chat
      const dmListModal = document.getElementById('dm-list-modal');
      if (dmListModal) dmListModal.classList.remove('active');
      openDMChatWith(user.id);
    };

    card.innerHTML = `
      <img src="${escapeHtml(user.avatar)}" alt="">
      ${user.status === 'online' ? '<div class="dm-online-dot"></div>' : ''}
      <div class="dm-info">
        <div class="dm-name">
          <span>${escapeHtml(user.name)}</span>
          <span class="role-badge ${user.role}">${getRoleTitle(user.role)}</span>
        </div>
        <div class="dm-last">${escapeHtml(lastMsgText)}</div>
      </div>
      ${unreadCount > 0 ? `<div class="dm-unread">${unreadCount}</div>` : ''}
    `;

    container.appendChild(card);
  });
}

export function renderActiveDMMessages(): void {
  const container = document.getElementById('dm-chat-messages');
  if (!container || !activeDMUserId) return;

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const allDMs = getDMMessages();
  const conversation = allDMs.filter(
    m => (m.fromId === currentUser.id && m.toId === activeDMUserId) ||
         (m.fromId === activeDMUserId && m.toId === currentUser.id)
  ).sort((a, b) => a.timestamp - b.timestamp);

  container.innerHTML = '';

  conversation.forEach(msg => {
    const isMine = msg.fromId === currentUser.id;
    const row = document.createElement('div');
    row.className = `dm-msg-row ${isMine ? 'mine' : 'others'}`;

    let ticksHtml = '';
    if (isMine) {
      if (msg.isRead) {
        ticksHtml = '<span class="tick-double read">✓✓</span>';
      } else {
        ticksHtml = '<span class="tick-double">✓✓</span>';
      }
    }

    let mediaHtml = '';
    if (msg.mediaUrl) {
      if (msg.mediaType === 'video') {
        mediaHtml = `
          <div class="dm-media-container" onclick="window.openMediaViewer('${escapeHtml(msg.mediaUrl)}', 'video')">
            <video src="${escapeHtml(msg.mediaUrl)}"></video>
            <div class="dm-play-icon">▶</div>
          </div>
        `;
      } else {
        mediaHtml = `
          <div class="dm-media-container" onclick="window.openMediaViewer('${escapeHtml(msg.mediaUrl)}', 'image')">
            <img src="${escapeHtml(msg.mediaUrl)}" alt="">
          </div>
        `;
      }
    }

    const replyHtml = msg.replyTo ? `
      <div class="dm-reply-info">
        <div class="dm-rp-sender">${escapeHtml(msg.replyTo.senderName)}</div>
        <div class="dm-rp-text">${escapeHtml(msg.replyTo.text)}</div>
      </div>
    ` : '';

    row.innerHTML = `
      <div class="dm-bubble ${isMine ? 'mine' : 'others'}">
        ${replyHtml}
        ${msg.text ? `<div>${escapeHtml(msg.text)}</div>` : ''}
        ${mediaHtml}
        <div class="dm-time">
          ${ticksHtml}
          <span>${msg.time}</span>
        </div>
      </div>
      <div class="dm-msg-actions">
        <button class="dm-action-btn reply" onclick="window.onReplyDM('${msg.id}')">رد</button>
        ${isMine ? `<button class="dm-action-btn del" onclick="window.onDeleteDM('${msg.id}')">حذف</button>` : ''}
      </div>
    `;

    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

export function sendDMMessage(text: string, mediaUrl?: string, mediaType?: 'image' | 'video'): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser || !activeDMUserId) return false;

  const trimmed = text.trim();
  if (!trimmed && !mediaUrl) return false;

  const newDM: DMMessage = {
    id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    fromId: currentUser.id,
    toId: activeDMUserId,
    text: trimmed,
    time: formatTime(Date.now()),
    timestamp: Date.now(),
    mediaUrl,
    mediaType,
    replyTo: activeDMReply || undefined,
    isRead: false,
  };

  addDMMessage(newDM);
  activeDMReply = null;
  updateDMReplyBarUI();
  playMessageSentSound();
  renderActiveDMMessages();
  updateTotalUnreadDMBadge();
  return true;
}

export function deleteDMMessage(id: string): void {
  const allDMs = getDMMessages();
  const filtered = allDMs.filter(m => m.id !== id);
  saveDMMessages(filtered);
  renderActiveDMMessages();
}

export function clearCurrentDMChat(): void {
  if (!activeDMUserId) return;
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (confirm('هل ترغب في مسح محادثة الخاص هذه؟')) {
    const allDMs = getDMMessages();
    const filtered = allDMs.filter(
      m => !(
        (m.fromId === currentUser.id && m.toId === activeDMUserId) ||
        (m.fromId === activeDMUserId && m.toId === currentUser.id)
      )
    );
    saveDMMessages(filtered);
    renderActiveDMMessages();
  }
}

export function markDMsAsRead(fromUserId: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const allDMs = getDMMessages();
  let changed = false;
  allDMs.forEach(m => {
    if (m.fromId === fromUserId && m.toId === currentUser.id && !m.isRead) {
      m.isRead = true;
      changed = true;
    }
  });

  if (changed) {
    saveDMMessages(allDMs);
    updateTotalUnreadDMBadge();
  }
}

export function updateTotalUnreadDMBadge(): void {
  const currentUser = getCurrentUser();
  const badge = document.getElementById('dm-badge');
  if (!badge) return;

  if (!currentUser) {
    badge.classList.remove('active');
    badge.textContent = '0';
    return;
  }

  const allDMs = getDMMessages();
  const unreadCount = allDMs.filter(m => m.toId === currentUser.id && !m.isRead).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
    badge.classList.add('active');
  } else {
    badge.classList.remove('active');
  }
}

export function renderDMMonitor(searchQuery = ''): void {
  const container = document.getElementById('dm-monitor-list');
  if (!container) return;

  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">ميزة المراقبة مقتصرة على المالك والمدير.</div>';
    return;
  }

  const allDMs = getDMMessages();
  const users = getUsers();
  const userMap = new Map<string, User>(users.map(u => [u.id, u]));

  // Group pairs of users
  const pairsMap = new Map<string, DMMessage[]>();

  allDMs.forEach(msg => {
    const pairKey = [msg.fromId, msg.toId].sort().join('___');
    if (!pairsMap.has(pairKey)) {
      pairsMap.set(pairKey, []);
    }
    pairsMap.get(pairKey)!.push(msg);
  });

  container.innerHTML = '';

  if (pairsMap.size === 0) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">لا توجد محادثات خاصة مسجلة حالياً.</div>';
    return;
  }

  pairsMap.forEach((msgs, pairKey) => {
    const [u1Id, u2Id] = pairKey.split('___');
    const u1 = userMap.get(u1Id) || { name: 'مستخدم محذوف', avatar: '' } as User;
    const u2 = userMap.get(u2Id) || { name: 'مستخدم محذوف', avatar: '' } as User;

    if (searchQuery && !u1.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u2.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return;
    }

    const lastMsg = msgs.sort((a, b) => b.timestamp - a.timestamp)[0];

    const card = document.createElement('div');
    card.className = 'dm-monitor-card';
    card.onclick = () => window.openDMMonitorView(u1Id, u2Id);

    card.innerHTML = `
      <div class="dm-users">
        <img src="${escapeHtml(u1.avatar)}" alt="">
        <span class="dm-arrow">⇄</span>
        <img src="${escapeHtml(u2.avatar)}" alt="">
        <div class="dm-names">
          <span>${escapeHtml(u1.name)} &amp; ${escapeHtml(u2.name)}</span>
          <span class="dm-last-msg">${lastMsg.mediaUrl ? '📎 وسائط' : escapeHtml(lastMsg.text)}</span>
        </div>
      </div>
      <span style="font-size:11px;color:#999;">(${msgs.length} رسالة)</span>
    `;

    container.appendChild(card);
  });
}

function updateDMReplyBarUI(): void {
  const replyBar = document.getElementById('dm-reply-bar');
  const senderEl = document.getElementById('dm-reply-sender-name');
  const textEl = document.getElementById('dm-reply-content-text');

  if (!replyBar || !senderEl || !textEl) return;

  if (activeDMReply) {
    senderEl.textContent = `رد على: ${activeDMReply.senderName}`;
    textEl.textContent = activeDMReply.text;
    replyBar.classList.add('active');
  } else {
    replyBar.classList.remove('active');
  }
}

export function cancelDMReply(): void {
  activeDMReply = null;
  updateDMReplyBarUI();
}

function getRoleTitle(role: string): string {
  switch (role) {
    case 'owner': return '👑 مالك';
    case 'manager': return '💎 مدير';
    case 'mod': return '🛡️ مشرف';
    case 'trusted': return '✅ موثوق';
    default: return 'عضو';
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
