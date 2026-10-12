import { ChatMessage, MessageReply, Role } from './types';
import { addMessage, getCurrentUser, getMessages, getSettings, getUsers, saveMessages } from './storage';
import { playMessageReceivedSound, playMessageSentSound } from './audio';

let activeReply: MessageReply | null = null;

export function getActiveReply(): MessageReply | null {
  return activeReply;
}

export function setActiveReply(reply: MessageReply | null): void {
  activeReply = reply;
  updateReplyBarUI();
}

function updateReplyBarUI(): void {
  const replyBar = document.getElementById('reply-bar');
  const senderEl = document.getElementById('reply-sender-name');
  const textEl = document.getElementById('reply-content-text');

  if (!replyBar || !senderEl || !textEl) return;

  if (activeReply) {
    senderEl.textContent = `رد على: ${activeReply.senderName}`;
    textEl.textContent = activeReply.text;
    replyBar.classList.add('active');
  } else {
    replyBar.classList.remove('active');
  }
}

export function cancelReply(): void {
  setActiveReply(null);
}

export function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function renderMessages(): void {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const messages = getMessages();
  const currentUser = getCurrentUser();
  const users = getUsers();

  // Keep chat-effects or loading-more if present
  const effectEl = container.querySelector('.chat-effects');
  const loadingEl = document.getElementById('loading-more');

  container.innerHTML = '';
  if (effectEl) container.appendChild(effectEl);
  if (loadingEl) container.appendChild(loadingEl);

  let lastDateStr = '';

  messages.forEach(msg => {
    const isMine = currentUser && msg.senderId === currentUser.id;
    const msgDateStr = formatDate(msg.timestamp);

    // Insert date separator
    if (msgDateStr !== lastDateStr) {
      const dateSep = document.createElement('div');
      dateSep.className = 'date-separator';
      dateSep.innerHTML = `<span>${msgDateStr}</span>`;
      container.appendChild(dateSep);
      lastDateStr = msgDateStr;
    }

    const row = document.createElement('div');
    row.className = `msg-row ${isMine ? 'mine' : 'others'}`;
    row.dataset.msgId = msg.id;

    // Special alert broadcast row
    if (msg.isAlert) {
      row.className = 'alert-msg-row';
      row.innerHTML = `
        <div class="alert-bubble">
          <div class="alert-title">🚨 تنبيه عاجل من الإدارة 🚨</div>
          <div class="alert-text">${escapeHtml(msg.text)}</div>
          <div class="alert-sender-info">
            <img src="${escapeHtml(msg.senderAvatar)}" alt="">
            <span>${escapeHtml(msg.senderName)}</span>
            <span>•</span>
            <span>${msg.time}</span>
          </div>
          ${msg.alertTarget && msg.alertTarget !== 'all' ? `<div class="alert-target">موجه إلى: ${escapeHtml(msg.alertTarget)}</div>` : ''}
        </div>
      `;
      container.appendChild(row);
      return;
    }

    // Role-based Bubble Class
    let bubbleClass = 'bubble';
    if (msg.senderRole === 'owner') bubbleClass += ' bubble-owner';
    else if (msg.senderRole === 'manager') bubbleClass += ' bubble-manager';
    else if (msg.senderRole === 'mod') bubbleClass += ' bubble-mod';
    else bubbleClass += ' bubble-user';

    // Premium Owner Custom Style
    if (msg.senderCustomBubble === 'king') bubbleClass += ' bubble-owner-king';
    else if (msg.senderCustomBubble === 'gift') bubbleClass += ' bubble-owner-gift';
    else if (msg.senderCustomBubble === 'neon') bubbleClass += ' bubble-owner-neon';

    // Custom text or bubble color if set
    let bubbleStyle = '';
    if (msg.senderColor && msg.senderRole !== 'owner') {
      bubbleStyle = `border-right: 4px solid ${msg.senderColor};`;
    }

    let nameClass = 'sender-name';
    if (msg.senderNameAnim) nameClass += ` ${msg.senderNameAnim}`;
    if (msg.senderRole === 'owner') nameClass += ' owner-name-special';

    let avatarClass = 'sender-avatar';
    if (msg.senderRole === 'owner') avatarClass += ' owner-avatar-special';

    // Sender Info Header
    const senderInfoHtml = !isMine ? `
      <div class="sender-info">
        <img src="${escapeHtml(msg.senderAvatar)}" class="${avatarClass}" onclick="window.onUserAvatarClick('${msg.senderId}')" alt="">
        <span class="${nameClass}" onclick="window.onUserNameClick('${msg.senderId}')">
          ${escapeHtml(msg.senderName)}
          ${msg.senderRole === 'owner' ? '<span class="owner-crown-badge">👑</span>' : ''}
        </span>
      </div>
    ` : '';

    // Reply preview
    const replyHtml = msg.replyTo ? `
      <div class="reply-quote-preview">
        <strong>${escapeHtml(msg.replyTo.senderName)}</strong>
        <div>${escapeHtml(msg.replyTo.text)}</div>
      </div>
    ` : '';

    // Media
    let mediaHtml = '';
    if (msg.mediaUrl) {
      if (msg.mediaType === 'video') {
        mediaHtml = `
          <div class="media-container" onclick="window.openMediaViewer('${escapeHtml(msg.mediaUrl)}', 'video')">
            <video src="${escapeHtml(msg.mediaUrl)}" preload="metadata"></video>
            <div class="play-icon">▶</div>
          </div>
        `;
      } else {
        mediaHtml = `
          <div class="media-container" onclick="window.openMediaViewer('${escapeHtml(msg.mediaUrl)}', 'image')">
            <img src="${escapeHtml(msg.mediaUrl)}" loading="lazy" alt="media">
          </div>
        `;
      }
    }

    // YouTube Embed
    let youtubeHtml = '';
    if (msg.youtubeId) {
      youtubeHtml = `
        <div class="youtube-container">
          <iframe src="https://www.youtube.com/embed/${msg.youtubeId}?autoplay=0" allowfullscreen></iframe>
        </div>
      `;
    }

    // Actions Bar (Reply, Report, DM, Delete, Ban, Mute)
    const canModerate = currentUser && (currentUser.role === 'owner' || currentUser.role === 'manager' || currentUser.role === 'mod');
    const isOwner = currentUser && currentUser.role === 'owner';

    const actionsHtml = `
      <div class="msg-actions">
        <button class="action-sm reply" onclick="window.onReplyMessage('${msg.id}')">رد</button>
        ${!isMine ? `<button class="action-sm dm" onclick="window.onStartDM('${msg.senderId}')">خاص</button>` : ''}
        ${!isMine ? `<button class="action-sm report" onclick="window.onReportMessage('${msg.id}')">إبلاغ</button>` : ''}
        ${isMine || canModerate ? `<button class="action-sm del" onclick="window.onDeleteMessage('${msg.id}')">حذف</button>` : ''}
        ${!isMine && canModerate ? `<button class="action-sm mute" onclick="window.onMuteUser('${msg.senderId}')">كتم</button>` : ''}
        ${!isMine && canModerate ? `<button class="action-sm ban" onclick="window.onBanUser('${msg.senderId}')">حظر</button>` : ''}
        ${isOwner && !isMine ? `<button class="action-sm promote" onclick="window.onPromoteUser('${msg.senderId}')">رتبة</button>` : ''}
      </div>
    `;

    row.innerHTML = `
      ${senderInfoHtml}
      <div class="${bubbleClass}" style="${bubbleStyle}">
        ${replyHtml}
        ${msg.text ? `<div>${escapeHtml(msg.text)}</div>` : ''}
        ${mediaHtml}
        ${youtubeHtml}
        <div class="msg-time">${msg.time}</div>
      </div>
      ${actionsHtml}
    `;

    container.appendChild(row);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

export function sendChatMessage(text: string, mediaUrl?: string, mediaType?: 'image' | 'video'): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  const settings = getSettings();

  // Check if banned
  if (currentUser.isBanned) {
    showScreen('ban-screen');
    return false;
  }

  // Check if muted
  if (currentUser.mutedUntil && currentUser.mutedUntil > Date.now()) {
    alert('أنت مكتوم حالياً ولا يمكنك إرسال رسائل.');
    return false;
  }

  // Check role restriction
  const roleHierarchy: Record<Role, number> = { user: 1, trusted: 2, mod: 3, manager: 4, owner: 5 };
  if (roleHierarchy[currentUser.role] < roleHierarchy[settings.chatMinRole]) {
    alert(`الدردشة العامة مقيدة حالياً لرتبة ${settings.chatMinRole} وما فوق.`);
    return false;
  }

  // Check Individual Capability
  if (currentUser.capabilities && currentUser.capabilities.canChat === false) {
    alert('تم سحب صلاحية الدردشة منك بواسطة الإدارة.');
    return false;
  }

  const trimmedText = text.trim();
  if (!trimmedText && !mediaUrl) return false;

  const youtubeId = trimmedText ? extractYouTubeId(trimmedText) : null;

  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    senderAvatar: currentUser.avatar,
    senderColor: currentUser.color,
    senderGlow: currentUser.glow,
    senderNameAnim: currentUser.nameAnim,
    senderCustomBubble: currentUser.customBubble,
    senderCustomFrame: currentUser.customFrame,
    text: trimmedText,
    time: formatTime(Date.now()),
    timestamp: Date.now(),
    mediaUrl,
    mediaType,
    youtubeId: youtubeId || undefined,
    replyTo: activeReply || undefined,
  };

  addMessage(newMsg);
  cancelReply();
  playMessageSentSound();
  renderMessages();
  return true;
}

export function deleteChatMessage(id: string): void {
  const messages = getMessages();
  const filtered = messages.filter(m => m.id !== id);
  saveMessages(filtered);
  renderMessages();
}

export function clearAllChat(): void {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    alert('هذه الصلاحية للمالك فقط.');
    return;
  }

  if (confirm('هل أنت متأكد من مسح جميع رسائل الدردشة العامة؟')) {
    saveMessages([]);
    renderMessages();
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

function showScreen(screenId: string): void {
  const screen = document.getElementById(screenId);
  if (screen) screen.style.display = 'flex';
}
