import { StatusItem } from './types';
import { getCurrentUser, getStatuses, saveStatuses } from './storage';
import { formatTime } from './chat';

let currentViewingStatuses: StatusItem[] = [];
let currentViewingIndex = 0;
let statusTimerId: number | null = null;

export function renderStatusesList(): void {
  const container = document.getElementById('status-list');
  const unseenBadge = document.getElementById('status-unseen-count');
  if (!container) return;

  const currentUser = getCurrentUser();
  const allStatuses = getStatuses();

  // Group by user
  const userMap = new Map<string, StatusItem[]>();
  allStatuses.forEach(s => {
    if (!userMap.has(s.userId)) {
      userMap.set(s.userId, []);
    }
    userMap.get(s.userId)!.push(s);
  });

  let totalUnseen = 0;
  container.innerHTML = '';

  if (userMap.size === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:#999;font-size:14px;">📭 لا توجد حالات نشطة حالياً.</div>';
    if (unseenBadge) {
      unseenBadge.textContent = '0';
      unseenBadge.classList.remove('active');
    }
    return;
  }

  userMap.forEach((userStatuses, userId) => {
    // Sort latest first
    userStatuses.sort((a, b) => b.timestamp - a.timestamp);
    const latest = userStatuses[0];

    const hasUnseen = currentUser
      ? userStatuses.some(s => !s.seenBy.includes(currentUser.id))
      : false;

    if (hasUnseen) totalUnseen++;

    const card = document.createElement('div');
    card.className = `status-user-card ${hasUnseen ? 'unseen' : 'seen'}`;
    card.onclick = () => openStatusViewerForUser(userStatuses);

    card.innerHTML = `
      <div class="status-avatar-wrapper">
        <img src="${escapeHtml(latest.userAvatar)}" class="status-avatar" alt="">
        <div class="status-ring"></div>
      </div>
      <div class="status-user-info">
        <div class="status-username">${escapeHtml(latest.userName)}</div>
        <div class="status-time">${latest.time}</div>
        <div class="status-preview">${latest.type === 'media' ? '📷 وسائط' : escapeHtml(latest.content)}</div>
      </div>
      <div class="status-count ${hasUnseen ? '' : 'seen'}">${userStatuses.length}</div>
    `;

    container.appendChild(card);
  });

  if (unseenBadge) {
    if (totalUnseen > 0) {
      unseenBadge.textContent = totalUnseen.toString();
      unseenBadge.classList.add('active');
    } else {
      unseenBadge.classList.remove('active');
    }
  }
}

export function openStatusViewerForUser(statuses: StatusItem[]): void {
  if (!statuses || statuses.length === 0) return;

  currentViewingStatuses = statuses;
  currentViewingIndex = 0;

  const viewer = document.getElementById('status-viewer');
  if (viewer) {
    viewer.classList.add('active');
    showCurrentStatusIndex();
  }
}

export function closeStatusViewer(): void {
  const viewer = document.getElementById('status-viewer');
  if (viewer) viewer.classList.remove('active');
  if (statusTimerId) {
    clearTimeout(statusTimerId);
    statusTimerId = null;
  }
}

export function nextStatus(): void {
  if (currentViewingIndex < currentViewingStatuses.length - 1) {
    currentViewingIndex++;
    showCurrentStatusIndex();
  } else {
    closeStatusViewer();
  }
}

export function prevStatus(): void {
  if (currentViewingIndex > 0) {
    currentViewingIndex--;
    showCurrentStatusIndex();
  }
}

function showCurrentStatusIndex(): void {
  if (statusTimerId) {
    clearTimeout(statusTimerId);
    statusTimerId = null;
  }

  const current = currentViewingStatuses[currentViewingIndex];
  if (!current) {
    closeStatusViewer();
    return;
  }

  // Mark as seen
  const currentUser = getCurrentUser();
  if (currentUser && !current.seenBy.includes(currentUser.id)) {
    current.seenBy.push(currentUser.id);
    const all = getStatuses();
    const target = all.find(s => s.id === current.id);
    if (target && !target.seenBy.includes(currentUser.id)) {
      target.seenBy.push(currentUser.id);
      saveStatuses(all);
    }
  }

  const contentBox = document.getElementById('status-viewer-content');
  const infoBox = document.getElementById('status-viewer-info');

  if (contentBox) {
    if (current.type === 'media') {
      contentBox.innerHTML = `
        <img src="${escapeHtml(current.content)}" alt="" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:10px;">
      `;
    } else {
      contentBox.innerHTML = `
        <div style="background:linear-gradient(135deg,#008069,#004d40);color:#fff;padding:40px 24px;border-radius:14px;text-align:center;font-size:18px;font-weight:700;line-height:1.6;max-width:400px;word-break:break-word;">
          ${escapeHtml(current.content)}
        </div>
      `;
    }
  }

  if (infoBox) {
    infoBox.innerHTML = `
      <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${escapeHtml(current.userName)}</div>
      <div style="font-size:11px;opacity:0.8;">${current.time} (${currentViewingIndex + 1} من ${currentViewingStatuses.length})</div>
      <div class="seen-by">👁️ شوهدت بواسطة ${current.seenBy.length} مستخدم</div>
    `;
  }

  // Auto advance after 5 seconds
  statusTimerId = window.setTimeout(() => {
    nextStatus();
  }, 5000);
}

export function publishStatus(type: 'text' | 'media', content: string): boolean {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  if (currentUser.capabilities && currentUser.capabilities.canStatus === false) {
    alert('تم إيقاف صلاحية نشر الحالات لحسابك من قِبل الإدارة.');
    return false;
  }

  const trimmed = content.trim();
  if (!trimmed) return false;

  const newStatus: StatusItem = {
    id: 'status_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar,
    type,
    content: trimmed,
    time: formatTime(Date.now()),
    timestamp: Date.now(),
    seenBy: [currentUser.id],
  };

  const all = getStatuses();
  all.push(newStatus);
  saveStatuses(all);
  renderStatusesList();
  return true;
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
