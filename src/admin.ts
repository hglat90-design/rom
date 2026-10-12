import { PendingRegistration, ReportItem, Role, User, WarningAlert } from './types';
import { getCurrentUser, getPendingRegistrations, getReports, getSettings, getUsers, getWarnings, saveCurrentUser, savePendingRegistrations, saveReports, saveSettings, saveUsers, saveWarnings } from './storage';
import { playAlertSound } from './audio';
import { formatTime } from './chat';

// Mute Countdown Timer
let muteIntervalId: number | null = null;

export function initMuteCountdownChecker(): void {
  if (muteIntervalId) clearInterval(muteIntervalId);

  muteIntervalId = window.setInterval(() => {
    const currentUser = getCurrentUser();
    const banner = document.getElementById('mute-banner');
    const countdownEl = document.getElementById('mute-countdown');
    if (!banner || !countdownEl) return;

    if (currentUser && currentUser.mutedUntil && currentUser.mutedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((currentUser.mutedUntil - Date.now()) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      countdownEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      banner.classList.add('active');
    } else {
      banner.classList.remove('active');
    }
  }, 1000);
}

// Fullscreen Warning Alerts System
export function broadcastWarning(targetType: 'all' | 'user' | 'role', targetId: string, message: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const newWarning: WarningAlert = {
    id: 'warn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    senderAvatar: currentUser.avatar,
    targetType,
    targetId: targetId || undefined,
    message: message.trim(),
    timestamp: Date.now(),
    readers: {},
  };

  const warnings = getWarnings();
  warnings.unshift(newWarning);
  saveWarnings(warnings);
  checkActiveWarningForCurrentUser();
}

export function checkActiveWarningForCurrentUser(): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const warnings = getWarnings();
  // Find latest unread warning targeting this user
  const unreadWarning = warnings.find(w => {
    if (w.readers[currentUser.id]) return false; // already acknowledged

    if (w.targetType === 'all') return true;
    if (w.targetType === 'user' && w.targetId === currentUser.id) return true;
    if (w.targetType === 'role' && w.targetId === currentUser.role) return true;
    return false;
  });

  const overlay = document.getElementById('warning-overlay');
  if (!overlay) return;

  if (unreadWarning) {
    playAlertSound();

    const senderImg = document.getElementById('warning-sender-img') as HTMLImageElement;
    const senderName = document.getElementById('warning-sender-name');
    const senderRole = document.getElementById('warning-sender-role');
    const msgBox = document.getElementById('warning-msg-text');
    const ackBtn = document.getElementById('warning-ack-btn');

    if (senderImg) senderImg.src = unreadWarning.senderAvatar;
    if (senderName) senderName.textContent = unreadWarning.senderName;
    if (senderRole) senderRole.textContent = getRoleTitle(unreadWarning.senderRole);
    if (msgBox) msgBox.textContent = unreadWarning.message;

    if (ackBtn) {
      ackBtn.onclick = () => {
        acknowledgeWarning(unreadWarning.id);
        overlay.classList.remove('active');
      };
    }

    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

export function acknowledgeWarning(warnId: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const warnings = getWarnings();
  const warn = warnings.find(w => w.id === warnId);
  if (warn) {
    warn.readers[currentUser.id] = Date.now();
    saveWarnings(warnings);
  }
}

export function renderWarningHistory(searchQuery = ''): void {
  const container = document.getElementById('warning-history-list');
  if (!container) return;

  const warnings = getWarnings();
  const filtered = warnings.filter(w =>
    w.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="warning-history-empty">
        <span class="whe-icon">📭</span>
        <div class="whe-text">لا توجد تحذيرات</div>
        <div class="whe-subtext">جميع التحذيرات المرسلة ستظهر هنا</div>
      </div>
    `;
    return;
  }

  filtered.forEach(warn => {
    const card = document.createElement('div');
    card.className = 'warning-history-card';
    const readersCount = Object.keys(warn.readers).length;

    card.innerHTML = `
      <div class="whc-header-bar">
        <div class="whc-target-info">
          <span>📢 ${warn.targetType === 'all' ? 'للجميع' : `موجه لـ ${warn.targetId}`}</span>
        </div>
        <div class="whc-readers-badge">👁️ ${readersCount} قارئ</div>
      </div>
      <div class="whc-body">
        <div class="whc-message">${escapeHtml(warn.message)}</div>
        <div class="whc-footer">
          <div class="whc-time">
            <span>بواسطة ${escapeHtml(warn.senderName)}</span>
            <span>•</span>
            <span>${formatTime(warn.timestamp)}</span>
          </div>
          <div class="whc-actions">
            <button class="whc-btn delete" onclick="window.confirmDeleteSingleWarning('${warn.id}')">🗑️ حذف</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Moderation Actions
export function setUserRole(userId: string, role: Role): void {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.role = role;
    saveUsers(users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.role = role;
      saveCurrentUser(currentUser);
    }
  }
}

export function muteUser(userId: string, minutes: number): void {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.mutedUntil = Date.now() + (minutes * 60 * 1000);
    saveUsers(users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.mutedUntil = target.mutedUntil;
      saveCurrentUser(currentUser);
    }
  }
}

export function unmuteUser(userId: string): void {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.mutedUntil = 0;
    saveUsers(users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.mutedUntil = 0;
      saveCurrentUser(currentUser);
    }
  }
}

export function banUser(userId: string): void {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.isBanned = true;
    saveUsers(users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.isBanned = true;
      saveCurrentUser(currentUser);
      const banScreen = document.getElementById('ban-screen');
      if (banScreen) banScreen.style.display = 'flex';
    }
  }
}

export function unbanUser(userId: string): void {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.isBanned = false;
    saveUsers(users);
  }
}

export function deleteUserAccount(userId: string): void {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveUsers(filtered);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    saveCurrentUser(null);
    const delScreen = document.getElementById('deleted-screen');
    if (delScreen) delScreen.style.display = 'flex';
  }
}

// Reports System
export function submitReport(
  type: 'message' | 'user' | 'status' | 'dm',
  targetId: string,
  targetName: string,
  reason: string,
  details: string,
  messageKey?: string,
  messageContent?: string,
  mediaUrl?: string
): void {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const newReport: ReportItem = {
    id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    reporterId: currentUser.id,
    reporterName: currentUser.name,
    targetId,
    targetName,
    type,
    messageKey,
    messageContent,
    mediaUrl,
    reason,
    details,
    status: 'pending',
    timestamp: Date.now(),
  };

  const reports = getReports();
  reports.unshift(newReport);
  saveReports(reports);
  updateReportsBadge();
  alert('تم إرسال بلاغك بنجاح وسيتعامل معه المشرفون فوراً.');
}

export function resolveReport(reportId: string, action: string, comment: string): void {
  const reports = getReports();
  const rep = reports.find(r => r.id === reportId);
  if (rep) {
    rep.status = action === 'none' ? 'rejected' : 'resolved';
    rep.resolvedAction = action;
    rep.resolvedComment = comment;

    // Apply punishment if selected
    if (action === 'ban') {
      banUser(rep.targetId);
    } else if (action === 'mute') {
      muteUser(rep.targetId, 60); // 1 hour default
    } else if (action === 'kick') {
      // transient kick
    }

    saveReports(reports);
    updateReportsBadge();
  }
}

export function updateReportsBadge(): void {
  const badge = document.getElementById('reports-badge');
  const countSpan = document.getElementById('reports-count');
  const btn = document.getElementById('reports-btn');

  const currentUser = getCurrentUser();
  if (!btn || !currentUser) return;

  const canSeeReports = currentUser.role === 'owner' || currentUser.role === 'manager' || currentUser.role === 'mod';
  btn.style.display = canSeeReports ? 'inline-flex' : 'none';

  if (!canSeeReports) return;

  const reports = getReports();
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (countSpan) countSpan.textContent = `(${pendingCount})`;

  if (badge) {
    if (pendingCount > 0) {
      badge.textContent = pendingCount.toString();
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
  }
}

export function renderReportsList(filter: 'pending' | 'resolved' | 'rejected' | 'all' = 'pending'): void {
  const container = document.getElementById('reports-list');
  if (!container) return;

  const reports = getReports();
  const filtered = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#999;padding:30px 0;">لا توجد بلاغات في هذا القسم.</div>';
    return;
  }

  filtered.forEach(rep => {
    const card = document.createElement('div');
    card.className = 'report-card';

    let statusClass = 'status-pending';
    let statusText = 'معلق';
    if (rep.status === 'resolved') {
      statusClass = 'status-resolved';
      statusText = `محلول (${rep.resolvedAction})`;
    } else if (rep.status === 'rejected') {
      statusClass = 'status-rejected';
      statusText = 'مرفوض';
    }

    card.innerHTML = `
      <div class="report-header">
        <div>
          <span class="reporter">${escapeHtml(rep.reporterName)}</span>
          <span> أبلغ عن </span>
          <span class="target">${escapeHtml(rep.targetName)}</span>
        </div>
        <span class="report-status ${statusClass}">${statusText}</span>
      </div>
      <div class="report-reason"><strong>السبب:</strong> ${escapeHtml(rep.reason)}</div>
      ${rep.details ? `<div style="font-size:12px;color:#666;">${escapeHtml(rep.details)}</div>` : ''}
      ${rep.messageContent ? `<div class="report-msg">💬 "${escapeHtml(rep.messageContent)}"</div>` : ''}
      ${rep.mediaUrl ? `<div class="report-msg"><img src="${escapeHtml(rep.mediaUrl)}" alt=""></div>` : ''}
      ${rep.status === 'pending' ? `
        <div class="report-actions">
          <button class="action-btn-sm action-ban" onclick="window.openResolveModal('${rep.id}', 'ban', '${escapeHtml(rep.targetName)}')">🚫 حظر</button>
          <button class="action-btn-sm action-mute" onclick="window.openResolveModal('${rep.id}', 'mute', '${escapeHtml(rep.targetName)}')">🔇 كتم</button>
          <button class="action-btn-sm action-none" onclick="window.openResolveModal('${rep.id}', 'none', '${escapeHtml(rep.targetName)}')">❌ رفض</button>
        </div>
      ` : ''}
      ${rep.resolvedComment ? `<div class="report-comment"><strong>ملاحظة الإدارة:</strong> ${escapeHtml(rep.resolvedComment)}</div>` : ''}
    `;

    container.appendChild(card);
  });
}

// Pending Registrations
export function updatePendingBadge(): void {
  const btn = document.getElementById('pending-reg-btn');
  const badge = document.getElementById('pending-badge');
  const countSpan = document.getElementById('pending-reg-count');

  const currentUser = getCurrentUser();
  const settings = getSettings();
  if (!btn || !currentUser) return;

  const canApprove = currentUser.role === 'owner' ||
    settings.approvalRoles.includes(currentUser.role) ||
    settings.approvalUsers.includes(currentUser.id);

  btn.style.display = canApprove ? 'inline-flex' : 'none';
  if (!canApprove) return;

  const list = getPendingRegistrations().filter(p => p.status === 'pending');
  if (countSpan) countSpan.textContent = list.length.toString();

  if (badge) {
    if (list.length > 0) {
      badge.textContent = list.length.toString();
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
  }
}

export function renderPendingRegistrations(searchQuery = ''): void {
  const container = document.getElementById('pending-registrations-list');
  if (!container) return;

  const list = getPendingRegistrations().filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div class="pending-reg-empty">لا توجد طلبات تسجيل معلقة.</div>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = `pending-reg-card status-${item.status}`;

    card.innerHTML = `
      <img src="${escapeHtml(item.avatar)}" alt="">
      <div class="prc-info">
        <div class="prc-name">${escapeHtml(item.name)}</div>
        <div class="prc-phone">${escapeHtml(item.phone)}</div>
        <div class="prc-time">${formatTime(item.timestamp)}</div>
      </div>
      ${item.status === 'pending' ? `
        <div class="prc-actions">
          <button class="prc-btn approve" onclick="window.approvePendingRegistration('${item.id}')">✓ موافقة</button>
          <button class="prc-btn reject" onclick="window.rejectPendingRegistration('${item.id}')">✕ رفض</button>
        </div>
      ` : `<div style="font-size:11px;font-weight:700;">${item.status === 'approved' ? '✅ تمت الموافقة' : '❌ تم الرفض'}</div>`}
    `;

    container.appendChild(card);
  });
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
