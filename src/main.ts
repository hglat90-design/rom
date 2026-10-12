import './style.css';
import { Role, User } from './types';
import {
  getCurrentUser,
  getPendingRegistrations,
  getReports,
  getSettings,
  getUsers,
  getWarnings,
  onRealtimeEvent,
  saveCurrentUser,
  savePendingRegistrations,
  saveReports,
  saveSettings,
  saveUsers,
  saveWarnings,
} from './storage';
import {
  cancelReply,
  clearAllChat,
  deleteChatMessage,
  renderMessages,
  sendChatMessage,
  setActiveReply,
} from './chat';
import {
  cancelDMReply,
  clearCurrentDMChat,
  closeDMChat,
  deleteDMMessage,
  openDMChatWith,
  renderActiveDMMessages,
  renderDMMonitor,
  renderDMUsersList,
  sendDMMessage,
  updateTotalUnreadDMBadge,
} from './dm';
import {
  closeStatusViewer,
  nextStatus,
  prevStatus,
  publishStatus,
  renderStatusesList,
} from './status';
import {
  banUser,
  broadcastWarning,
  checkActiveWarningForCurrentUser,
  deleteUserAccount,
  initMuteCountdownChecker,
  muteUser,
  renderPendingRegistrations,
  renderReportsList,
  renderWarningHistory,
  resolveReport,
  setUserRole,
  submitReport,
  unbanUser,
  unmuteUser,
  updatePendingBadge,
  updateReportsBadge,
} from './admin';
import {
  applyAppSettingsToDOM,
  renderBackgroundPresets,
  renderEffectsPresets,
  renderNameAnimationsGrid,
  renderThemePresetPickers,
  updateThemePreview,
} from './customizer';
import {
  checkAuthStateOnStartup,
  performLogin,
  performLogout,
  startTelegramVerification,
  verifyTelegramContactSuccess,
} from './auth';
import { toggleSound } from './audio';
import { getUploadApiUrl, saveUploadApiUrl, uploadMedia, UPLOAD_PRESETS } from './uploader';

// Extend window object for HTML inline handlers
declare global {
  interface Window {
    openUploadSettings: () => void;
    closeUploadSettings: () => void;
    saveUploadSettings: () => void;
    selectUploadPreset: (url: string) => void;
    quickLoginAs: (type: 'owner' | 'guest') => void;
    initTelegramVerification: (e: Event) => void;
    checkTelegramContactAndLogin: (e: Event) => void;
    skipVerificationIfAllowed: () => void;
    goToVerifyStep1: () => void;
    checkPendingApprovalStatus: () => void;
    cancelPendingRequest: () => void;
    resetDeviceAndRetry: () => void;
    clearAllChat: () => void;
    openPendingRegistrations: () => void;
    closePendingRegistrations: () => void;
    toggleReportsModal: () => void;
    openDMList: () => void;
    closeDMList: () => void;
    closeDMChat: () => void;
    clearCurrentDMChat: () => void;
    openDMMonitor: () => void;
    closeDMMonitor: () => void;
    renderDMMonitor: () => void;
    openDMMonitorView: (u1Id: string, u2Id: string) => void;
    closeDMMonitorView: () => void;
    toggleSoundQuick: () => void;
    requestNotificationPermission: () => void;
    openNotifications: () => void;
    closeNotifications: () => void;
    clearAllNotifications: () => void;
    openProfile: () => void;
    closeProfile: () => void;
    toggleUsers: () => void;
    filterUsers: () => void;
    filterDMUsers: () => void;
    filterDMMonitor: () => void;
    filterPendingRegistrations: () => void;
    filterReports: (filter: 'pending' | 'resolved' | 'rejected' | 'all', btn?: HTMLElement) => void;
    openResolveModal: (reportId: string, action: string, targetName: string) => void;
    resolveReport: (action: string) => void;
    closeAllModals: () => void;
    switchTab: (tab: 'chat' | 'status') => void;
    closeStatusScreen: () => void;
    openAddStatus: () => void;
    closeAddStatus: () => void;
    selectStatusType: (type: 'text' | 'media') => void;
    handleStatusFile: (input: HTMLInputElement) => void;
    publishStatus: () => void;
    closeStatusViewer: () => void;
    nextStatus: () => void;
    prevStatus: () => void;
    sendMessage: (e: Event) => void;
    sendDMMessage: (e: Event) => void;
    handleFile: (input: HTMLInputElement) => void;
    handleDMMedia: (input: HTMLInputElement) => void;
    cancelReply: () => void;
    cancelDMReply: () => void;
    openYouTubeModal: () => void;
    closeYouTubeModal: () => void;
    submitYouTubeUrl: () => void;
    openAlertComposer: () => void;
    closeAlertComposer: () => void;
    selectAlertTarget: (target: 'all' | 'user') => void;
    filterAlertUsers: () => void;
    sendChatAlert: () => void;
    openMediaViewer: (url: string, type: 'image' | 'video') => void;
    closeMediaViewer: () => void;
    onUserAvatarClick: (userId: string) => void;
    onUserNameClick: (userId: string) => void;
    onReplyMessage: (msgId: string) => void;
    onDeleteMessage: (msgId: string) => void;
    onStartDM: (userId: string) => void;
    onReportMessage: (msgId: string) => void;
    onMuteUser: (userId: string) => void;
    onBanUser: (userId: string) => void;
    onPromoteUser: (userId: string) => void;
    onReplyDM: (msgId: string) => void;
    onDeleteDM: (msgId: string) => void;
    deleteAllUnknownUsers: () => void;
    clearAllDMs: () => void;
    setRole: (role: Role) => void;
    applyMute: (minutes: number) => void;
    openSecuritySettings: () => void;
    toggleVerificationGate: () => void;
    toggleAutoRegistration: () => void;
    openChatSettings: () => void;
    setChatMinRole: (role: Role) => void;
    openMaintenanceModal: () => void;
    toggleMaintenanceStatus: () => void;
    saveMaintenanceSettings: () => void;
    openAdvancedModal: () => void;
    handleFontFile: (input: HTMLInputElement) => void;
    uploadAndApplyFont: () => void;
    resetFontToDefault: () => void;
    openBgSettings: () => void;
    uploadChatBg: (type: 'general' | 'dm', input: HTMLInputElement) => void;
    removeChatBg: (type: 'general' | 'dm') => void;
    resetBgToDefault: () => void;
    openAnimSettings: () => void;
    selectAnim: (type: 'arrive' | 'send', anim: string) => void;
    toggleEffect: (type: string) => void;
    saveAnimSettings: () => void;
    resetAnimToDefault: () => void;
    openEffectsSettings: () => void;
    saveEffectsSettings: () => void;
    resetEffectsToDefault: () => void;
    openThemeSettings: () => void;
    saveThemeSettings: () => void;
    resetThemeSettings: () => void;
    closeThemeSettings: () => void;
    openCapabilitiesModal: (userId: string) => void;
    closeCapabilitiesModal: () => void;
    allowAllCapabilities: (userId: string) => void;
    denyAllCapabilities: (userId: string) => void;
    resetAllCapabilities: (userId: string) => void;
    openOwnerPremium: () => void;
    closeOwnerPremiumModal: () => void;
    saveOwnerPremiumSettings: () => void;
    resetOwnerPremiumSettings: () => void;
    toggleOwnerOption: (opt: string) => void;
    openWarningHistory: () => void;
    closeWarningHistory: () => void;
    filterWarningHistory: () => void;
    confirmDeleteAllWarnings: () => void;
    confirmDeleteSingleWarning: (id: string) => void;
    executeWarningDelete: () => void;
    closeWarningDeleteModal: () => void;
    openMyColorControl: () => void;
    closeColorControl: () => void;
    applyUserColorSettings: () => void;
    resetUserColorSettings: () => void;
    previewProf: (input: HTMLInputElement) => void;
    saveProfile: () => void;
    deleteAccount: () => void;
    logout: () => void;
    approvePendingRegistration: (id: string) => void;
    rejectPendingRegistration: (id: string) => void;
    executeChangeName: () => void;
    closeChangeNameModal: () => void;
    submitReport: () => void;
    closeReportModal: () => void;
    selectQuickReason: (btn: HTMLElement, reason: string) => void;
    openDatabaseSettings: () => void;
    closeDatabaseSettings: () => void;
    saveDatabaseSettings: () => void;
  }
}

// Global modal target variables
let currentModalTargetUserId: string | null = null;
let currentResolveReportId: string | null = null;
let currentDeleteWarningId: string | null = null;
let pendingFontBase64: string | null = null;
let pendingStatusFileBase64: string | null = null;
let pendingStatusFileType: 'text' | 'media' = 'text';

function boot() {
  setupGlobalWindowHandlers();
  initApplication();
}

// Rock-solid boot pattern: run immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

function initApplication() {
  import('./firebase').then(fb => fb.initFirebase()).catch(() => {});

  const settings = getSettings();
  applyAppSettingsToDOM(settings);

  renderMessages();
  updateTotalUnreadDMBadge();
  updateReportsBadge();
  updatePendingBadge();
  initMuteCountdownChecker();
  checkActiveWarningForCurrentUser();
  checkAuthStateOnStartup();
  updateOnlineUsersBadge();

  // Listen to multi-tab events
  onRealtimeEvent((type) => {
    switch (type) {
      case 'messages_updated':
        renderMessages();
        break;
      case 'dm_updated':
        renderActiveDMMessages();
        updateTotalUnreadDMBadge();
        break;
      case 'statuses_updated':
        renderStatusesList();
        break;
      case 'reports_updated':
        updateReportsBadge();
        break;
      case 'warnings_updated':
        checkActiveWarningForCurrentUser();
        break;
      case 'settings_updated':
        applyAppSettingsToDOM(getSettings());
        break;
      case 'users_updated':
        updateOnlineUsersBadge();
        break;
    }
  });
}

function updateOnlineUsersBadge() {
  const badge = document.getElementById('online-badge');
  const btn = document.getElementById('btn-users');
  const users = getUsers();
  const onlineCount = users.filter(u => u.status === 'online').length;

  if (btn) btn.style.display = 'inline-flex';
  if (badge) {
    badge.textContent = onlineCount.toString();
    badge.classList.add('active');
  }
}

function setupGlobalWindowHandlers() {
  // Verification Gate
  window.initTelegramVerification = (e) => {
    e.preventDefault();
    startTelegramVerification();
  };

  window.checkTelegramContactAndLogin = (e) => {
    e.preventDefault();
    verifyTelegramContactSuccess();
  };

  window.skipVerificationIfAllowed = () => {
    const vScreen = document.getElementById('verify-screen');
    const lScreen = document.getElementById('login-screen');
    if (vScreen) vScreen.style.display = 'none';
    if (lScreen) lScreen.style.display = 'flex';
  };

  window.goToVerifyStep1 = () => {
    const sStart = document.getElementById('verify-step-start');
    const sLink = document.getElementById('verify-step-link');
    const d1 = document.getElementById('vstep1');
    const d2 = document.getElementById('vstep2');

    if (sStart) sStart.style.display = 'block';
    if (sLink) sLink.style.display = 'none';
    if (d1) { d1.classList.add('active'); d1.classList.remove('done'); }
    if (d2) { d2.classList.remove('active'); }
  };

  window.checkPendingApprovalStatus = () => {
    const pendingList = getPendingRegistrations();
    const currentUser = getCurrentUser();
    alert('طلبك قيد المراجعة حالياً من قبل الإدارة.');
  };

  window.cancelPendingRequest = () => {
    window.location.reload();
  };

  window.resetDeviceAndRetry = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Header Actions
  window.clearAllChat = () => {
    clearAllChat();
  };

  window.toggleSoundQuick = () => {
    const enabled = toggleSound();
    const btn = document.getElementById('sound-btn');
    if (btn) btn.textContent = enabled ? '🔊' : '🔇';
  };

  window.requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        alert(perm === 'granted' ? 'تم تفعيل الإشعارات بنجاح!' : 'تم رفض الإشعارات.');
      });
    }
  };

  // Tab Switching
  window.switchTab = (tab) => {
    const navChat = document.getElementById('nav-chat');
    const navStatus = document.getElementById('nav-status');
    const statusScreen = document.getElementById('status-screen');

    if (tab === 'chat') {
      if (navChat) navChat.classList.add('active');
      if (navStatus) navStatus.classList.remove('active');
      if (statusScreen) statusScreen.classList.remove('active');
    } else {
      if (navChat) navChat.classList.remove('active');
      if (navStatus) navStatus.classList.add('active');
      if (statusScreen) {
        statusScreen.classList.add('active');
        renderStatusesList();
      }
    }
  };

  window.closeStatusScreen = () => {
    window.switchTab('chat');
  };

  // Story / Status
  window.openAddStatus = () => {
    const modal = document.getElementById('add-status-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeAddStatus = () => {
    const modal = document.getElementById('add-status-modal');
    if (modal) modal.classList.remove('active');
    pendingStatusFileBase64 = null;
  };

  window.selectStatusType = (type) => {
    pendingStatusFileType = type;
    const btnText = document.getElementById('status-type-text');
    const btnMedia = document.getElementById('status-type-media');
    const areaText = document.getElementById('status-text-area');
    const areaMedia = document.getElementById('status-media-area');

    if (type === 'text') {
      if (btnText) btnText.classList.add('active');
      if (btnMedia) btnMedia.classList.remove('active');
      if (areaText) areaText.classList.add('active');
      if (areaMedia) areaMedia.classList.remove('active');
    } else {
      if (btnText) btnText.classList.remove('active');
      if (btnMedia) btnMedia.classList.add('active');
      if (areaText) areaText.classList.remove('active');
      if (areaMedia) areaMedia.classList.add('active');
    }
  };

  function showToast(msg: string) {
    let toast = document.getElementById('veysi-global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'veysi-global-toast';
      toast.style.cssText = 'position:fixed;bottom:75px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-family:inherit;z-index:999999;pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout((toast as any)._timeout);
    (toast as any)._timeout = setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 2500);
  }

  window.handleStatusFile = async (input) => {
    const file = input.files?.[0];
    if (file) {
      const nameEl = document.getElementById('selected-filename');
      if (nameEl) {
        nameEl.textContent = `📎 جاري الرفع: ${file.name}...`;
        nameEl.classList.add('active');
      }
      showToast('⏳ جاري رفع الوسائط...');
      try {
        pendingStatusFileBase64 = await uploadMedia(file, (msg) => showToast(msg));
        if (nameEl) {
          nameEl.textContent = `✅ تم الرفع: ${file.name}`;
        }
      } catch {
        if (nameEl) nameEl.textContent = `⚠️ تم التجهيز محلياً: ${file.name}`;
      }
    }
  };

  window.publishStatus = () => {
    if (pendingStatusFileType === 'text') {
      const input = document.getElementById('status-text-input') as HTMLTextAreaElement;
      if (input && input.value.trim()) {
        publishStatus('text', input.value.trim());
        input.value = '';
        window.closeAddStatus();
      }
    } else if (pendingStatusFileBase64) {
      publishStatus('media', pendingStatusFileBase64);
      window.closeAddStatus();
    }
  };

  window.closeStatusViewer = () => closeStatusViewer();
  window.nextStatus = () => nextStatus();
  window.prevStatus = () => prevStatus();

  // Send Message Forms
  window.sendMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input') as HTMLInputElement;
    if (input) {
      const success = sendChatMessage(input.value);
      if (success) input.value = '';
    }
  };

  window.sendDMMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('dm-message-input') as HTMLInputElement;
    if (input) {
      const success = sendDMMessage(input.value);
      if (success) input.value = '';
    }
  };

  window.handleFile = async (input) => {
    const file = input.files?.[0];
    if (file) {
      showToast('⏳ جاري رفع الصورة / الفيديو إلى مركز الرفع...');
      try {
        const url = await uploadMedia(file, (msg) => showToast(msg));
        const type = file.type.startsWith('video') ? 'video' : 'image';
        sendChatMessage('', url, type);
        showToast('✅ تم إرسال الوسائط بنجاح');
      } catch (err) {
        showToast('⚠️ تعذر الرفع، يرجى المحاولة لاحقاً');
      }
      input.value = '';
    }
  };

  window.handleDMMedia = async (input) => {
    const file = input.files?.[0];
    if (file) {
      showToast('⏳ جاري رفع الوسائط إلى مركز الرفع...');
      try {
        const url = await uploadMedia(file, (msg) => showToast(msg));
        const type = file.type.startsWith('video') ? 'video' : 'image';
        sendDMMessage('', url, type);
        showToast('✅ تم إرسال الوسائط بنجاح');
      } catch (err) {
        showToast('⚠️ تعذر الرفع، يرجى المحاولة لاحقاً');
      }
      input.value = '';
    }
  };

  window.cancelReply = () => cancelReply();
  window.cancelDMReply = () => cancelDMReply();

  // Modals management
  window.closeAllModals = () => {
    document.querySelectorAll('.modal-slide.active, .modal-popup.active').forEach(el => {
      el.classList.remove('active');
    });
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('show');
  };

  window.toggleUsers = () => {
    const modal = document.getElementById('users-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
      const isActive = modal.classList.contains('active');
      if (isActive) {
        modal.classList.remove('active');
        overlay.classList.remove('show');
      } else {
        modal.classList.add('active');
        overlay.classList.add('show');
        renderUsersModalList();
      }
    }
  };

  window.filterUsers = () => {
    const search = (document.getElementById('user-search') as HTMLInputElement)?.value || '';
    renderUsersModalList(search);
  };

  window.openDMList = () => {
    const modal = document.getElementById('dm-list-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
      modal.classList.add('active');
      overlay.classList.add('show');
      renderDMUsersList();
    }
  };

  window.closeDMList = () => {
    const modal = document.getElementById('dm-list-modal');
    if (modal) modal.classList.remove('active');
  };

  window.filterDMUsers = () => {
    const search = (document.getElementById('dm-search') as HTMLInputElement)?.value || '';
    renderDMUsersList(search);
  };

  window.closeDMChat = () => closeDMChat();
  window.clearCurrentDMChat = () => clearCurrentDMChat();

  window.openDMMonitor = () => {
    const modal = document.getElementById('dm-monitor-modal');
    if (modal) {
      modal.classList.add('active');
      renderDMMonitor();
    }
  };

  window.closeDMMonitor = () => {
    const modal = document.getElementById('dm-monitor-modal');
    if (modal) modal.classList.remove('active');
  };

  window.renderDMMonitor = () => renderDMMonitor();

  window.openDMMonitorView = (u1Id, u2Id) => {
    const modal = document.getElementById('dm-monitor-view-modal');
    const body = document.getElementById('dm-monitor-view-body');
    const users = getUsers();
    const u1 = users.find(u => u.id === u1Id);
    const u2 = users.find(u => u.id === u2Id);

    if (modal && body && u1 && u2) {
      modal.classList.add('active');
      const title = document.getElementById('dm-monitor-view-title');
      if (title) title.textContent = `محادثة: ${u1.name} و ${u2.name}`;
      body.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">جاري عرض الرسائل المتبادلة...</div>';
    }
  };

  window.closeDMMonitorView = () => {
    const modal = document.getElementById('dm-monitor-view-modal');
    if (modal) modal.classList.remove('active');
  };

  window.openNotifications = () => {
    const modal = document.getElementById('notifications-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeNotifications = () => {
    const modal = document.getElementById('notifications-modal');
    if (modal) modal.classList.remove('active');
  };

  window.clearAllNotifications = () => {
    const list = document.getElementById('notifications-list');
    if (list) list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">لا توجد إشعارات.</div>';
  };

  window.toggleReportsModal = () => {
    const modal = document.getElementById('reports-modal');
    if (modal) {
      modal.classList.toggle('active');
      if (modal.classList.contains('active')) renderReportsList();
    }
  };

  window.filterReports = (filter, btn) => {
    document.querySelectorAll('#reports-modal .filter-tabs button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderReportsList(filter);
  };

  window.openResolveModal = (reportId, action, targetName) => {
    currentResolveReportId = reportId;
    const modal = document.getElementById('resolve-modal');
    const targetSpan = document.getElementById('resolve-target-name');
    if (targetSpan) targetSpan.textContent = targetName;
    if (modal) modal.classList.add('active');
  };

  window.resolveReport = (action) => {
    if (!currentResolveReportId) return;
    const commentInput = document.getElementById('resolve-comment-input') as HTMLTextAreaElement;
    resolveReport(currentResolveReportId, action, commentInput ? commentInput.value : '');
    const modal = document.getElementById('resolve-modal');
    if (modal) modal.classList.remove('active');
    renderReportsList();
  };

  window.openPendingRegistrations = () => {
    const modal = document.getElementById('pending-registrations-modal');
    if (modal) {
      modal.classList.add('active');
      renderPendingRegistrations();
    }
  };

  window.closePendingRegistrations = () => {
    const modal = document.getElementById('pending-registrations-modal');
    if (modal) modal.classList.remove('active');
  };

  window.filterPendingRegistrations = () => {
    const search = (document.getElementById('pending-reg-search') as HTMLInputElement)?.value || '';
    renderPendingRegistrations(search);
  };

  window.approvePendingRegistration = (id) => {
    const list = getPendingRegistrations();
    const item = list.find(p => p.id === id);
    if (item) {
      item.status = 'approved';
      savePendingRegistrations(list);

      // Create approved user in users list
      const users = getUsers();
      users.push({
        id: 'usr_' + Date.now(),
        name: item.name,
        phone: item.phone,
        role: 'user',
        avatar: item.avatar,
        status: 'offline',
        lastSeen: Date.now(),
        capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
      });
      saveUsers(users);
      renderPendingRegistrations();
      updatePendingBadge();
    }
  };

  window.rejectPendingRegistration = (id) => {
    const list = getPendingRegistrations();
    const item = list.find(p => p.id === id);
    if (item) {
      item.status = 'rejected';
      savePendingRegistrations(list);
      renderPendingRegistrations();
      updatePendingBadge();
    }
  };

  // Media Viewer
  window.openMediaViewer = (url, type) => {
    const viewer = document.getElementById('media-viewer');
    const body = viewer?.querySelector('.viewer-body');
    if (viewer && body) {
      if (type === 'video') {
        body.innerHTML = `<video src="${url}" controls autoplay style="max-width:100%;max-height:85vh;"></video>`;
      } else {
        body.innerHTML = `<img src="${url}" style="max-width:100%;max-height:85vh;object-fit:contain;">`;
      }
      viewer.classList.add('active');
    }
  };

  window.closeMediaViewer = () => {
    const viewer = document.getElementById('media-viewer');
    if (viewer) viewer.classList.remove('active');
  };

  // Profile Modal
  window.openProfile = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const modal = document.getElementById('profile-modal');
    const img = document.getElementById('prof-img') as HTMLImageElement;
    const nameInput = document.getElementById('prof-name') as HTMLInputElement;

    if (img) img.src = currentUser.avatar;
    if (nameInput) nameInput.value = currentUser.name;

    // Show/hide owner buttons
    const isOwner = currentUser.role === 'owner';
    const ownerOnlyIds = [
      'btn-security-settings', 'btn-database-settings', 'btn-upload-settings', 'btn-chat-settings', 'btn-owner-premium',
      'btn-maintenance', 'btn-theme-settings', 'btn-bg-settings',
      'btn-anim-settings', 'btn-effects-settings', 'btn-advanced', 'btn-warning-history'
    ];

    ownerOnlyIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isOwner ? 'flex' : 'none';
    });

    if (modal) modal.classList.add('active');
  };

  window.closeProfile = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('active');
  };

  window.saveProfile = () => {
    const currentUser = getCurrentUser();
    const nameInput = document.getElementById('prof-name') as HTMLInputElement;
    if (currentUser && nameInput && nameInput.value.trim()) {
      currentUser.name = nameInput.value.trim();
      saveCurrentUser(currentUser);
      alert('تم حفظ بيانات الحساب بنجاح!');
      window.closeProfile();
      renderMessages();
    }
  };

  window.deleteAccount = () => {
    const currentUser = getCurrentUser();
    if (currentUser && confirm('هل أنت متأكد من حذف حسابك نهائياً؟')) {
      deleteUserAccount(currentUser.id);
    }
  };

  window.logout = () => {
    performLogout();
  };

  // Moderation & Message Actions
  window.onReplyMessage = (msgId) => {
    const messages = getUsers(); // Find message
    const allMsgs = getCurrentUser();
    // active reply
    setActiveReply({
      id: msgId,
      senderName: 'عضو',
      text: 'اقتباس الرسالة',
    });
  };

  window.onDeleteMessage = (msgId) => {
    deleteChatMessage(msgId);
  };

  window.onStartDM = (userId) => {
    openDMChatWith(userId);
  };

  window.onReportMessage = (msgId) => {
    const modal = document.getElementById('report-modal');
    const targetSpan = document.getElementById('report-target-name');
    const targetUid = document.getElementById('report-target-uid') as HTMLInputElement;
    if (targetUid) targetUid.value = msgId;
    if (modal) modal.classList.add('active');
  };

  window.onMuteUser = (userId) => {
    currentModalTargetUserId = userId;
    const modal = document.getElementById('mute-modal');
    if (modal) modal.classList.add('active');
  };

  window.applyMute = (minutes) => {
    if (currentModalTargetUserId) {
      muteUser(currentModalTargetUserId, minutes);
      const modal = document.getElementById('mute-modal');
      if (modal) modal.classList.remove('active');
      alert(`تم كتم المستخدم لمدة ${minutes} دقيقة.`);
    }
  };

  window.onBanUser = (userId) => {
    if (confirm('هل أنت متأكد من حظر هذا المستخدم؟')) {
      banUser(userId);
      alert('تم حظر المستخدم.');
    }
  };

  window.onPromoteUser = (userId) => {
    currentModalTargetUserId = userId;
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.add('active');
  };

  window.setRole = (role) => {
    if (currentModalTargetUserId) {
      setUserRole(currentModalTargetUserId, role);
      const modal = document.getElementById('role-modal');
      if (modal) modal.classList.remove('active');
      alert(`تم تعديل الرتبة إلى: ${role}`);
      renderMessages();
    }
  };

  // Warnings System
  window.openAlertComposer = () => {
    const modal = document.getElementById('alert-composer-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeAlertComposer = () => {
    const modal = document.getElementById('alert-composer-modal');
    if (modal) modal.classList.remove('active');
  };

  window.sendChatAlert = () => {
    const textInput = document.getElementById('alert-text-input') as HTMLTextAreaElement;
    if (textInput && textInput.value.trim()) {
      broadcastWarning('all', '', textInput.value.trim());
      textInput.value = '';
      window.closeAlertComposer();
    }
  };

  window.openWarningHistory = () => {
    const modal = document.getElementById('warning-history-modal');
    if (modal) {
      modal.classList.add('active');
      renderWarningHistory();
    }
  };

  window.closeWarningHistory = () => {
    const modal = document.getElementById('warning-history-modal');
    if (modal) modal.classList.remove('active');
  };

  window.confirmDeleteSingleWarning = (id) => {
    if (confirm('هل ترغب بحذف هذا التحذير نهائياً؟')) {
      const warnings = getWarnings().filter(w => w.id !== id);
      saveWarnings(warnings);
      renderWarningHistory();
    }
  };

  window.confirmDeleteAllWarnings = () => {
    if (confirm('هل ترغب بمسح جميع التحذيرات؟')) {
      saveWarnings([]);
      renderWarningHistory();
    }
  };

  // Theme & Customization
  window.openThemeSettings = () => {
    const modal = document.getElementById('theme-settings-modal');
    if (modal) {
      modal.classList.add('active');
      renderThemePresetPickers();
      updateThemePreview();
    }
  };

  window.closeThemeSettings = () => {
    const modal = document.getElementById('theme-settings-modal');
    if (modal) modal.classList.remove('active');
  };

  window.saveThemeSettings = () => {
    const settings = getSettings();
    settings.headerBg = (document.getElementById('theme-header-bg') as HTMLInputElement)?.value || settings.headerBg;
    settings.headerText = (document.getElementById('theme-header-text') as HTMLInputElement)?.value || settings.headerText;
    settings.bottomBg = (document.getElementById('theme-bottom-bg') as HTMLInputElement)?.value || settings.bottomBg;
    settings.bottomText = (document.getElementById('theme-bottom-text') as HTMLInputElement)?.value || settings.bottomText;
    saveSettings(settings);
    applyAppSettingsToDOM(settings);
    window.closeThemeSettings();
  };

  window.openBgSettings = () => {
    const modal = document.getElementById('bg-settings-modal');
    if (modal) {
      modal.classList.add('active');
      renderBackgroundPresets();
    }
  };

  window.openEffectsSettings = () => {
    const modal = document.getElementById('effects-settings-modal');
    if (modal) {
      modal.classList.add('active');
      renderEffectsPresets();
    }
  };

  window.openSecuritySettings = () => {
    const modal = document.getElementById('security-settings-modal');
    if (modal) modal.classList.add('active');
  };

  window.toggleVerificationGate = () => {
    const settings = getSettings();
    settings.verificationGateEnabled = !settings.verificationGateEnabled;
    saveSettings(settings);
    alert(`تم ${settings.verificationGateEnabled ? 'تفعيل' : 'إيقاف'} بوابة التوثيق.`);
  };

  window.toggleAutoRegistration = () => {
    const settings = getSettings();
    settings.autoRegistrationEnabled = !settings.autoRegistrationEnabled;
    saveSettings(settings);
    alert(`التسجيل التلقائي: ${settings.autoRegistrationEnabled ? 'مفعّل (دخول مباشر)' : 'معطّل (يتطلب موافقة)'}`);
  };

  // Database (Firebase) Settings Handlers
  window.openDatabaseSettings = () => {
    const modal = document.getElementById('database-settings-modal');
    if (!modal) return;

    import('./firebase').then(fb => {
      const cfg = fb.getSavedFirebaseConfig();
      const statusEl = document.getElementById('db-conn-status');
      const urlInput = document.getElementById('db-url-input') as HTMLInputElement;
      const keyInput = document.getElementById('db-key-input') as HTMLInputElement;
      const projInput = document.getElementById('db-proj-input') as HTMLInputElement;

      if (statusEl) {
        statusEl.innerHTML = fb.isFirebaseActive()
          ? '<span style="color:#2e7d32;font-weight:900;">🟢 متصل بقاعدة بيانات Firebase</span>'
          : '<span style="color:#e65100;font-weight:900;">🟡 يعمل حالياً بالتخزين المحلي السريع (Local Storage)</span>';
      }

      if (cfg) {
        if (urlInput) urlInput.value = cfg.databaseURL || '';
        if (keyInput) keyInput.value = cfg.apiKey || '';
        if (projInput) projInput.value = cfg.projectId || '';
      }
    });

    modal.classList.add('active');
  };

  window.closeDatabaseSettings = () => {
    const modal = document.getElementById('database-settings-modal');
    if (modal) modal.classList.remove('active');
  };

  window.saveDatabaseSettings = () => {
    const urlInput = document.getElementById('db-url-input') as HTMLInputElement;
    const keyInput = document.getElementById('db-key-input') as HTMLInputElement;
    const projInput = document.getElementById('db-proj-input') as HTMLInputElement;
    const jsonInput = document.getElementById('db-json-input') as HTMLTextAreaElement;

    let configToSave = {
      databaseURL: urlInput ? urlInput.value.trim() : '',
      apiKey: keyInput ? keyInput.value.trim() : '',
      projectId: projInput ? projInput.value.trim() : '',
    };

    if (jsonInput && jsonInput.value.trim()) {
      try {
        const parsed = JSON.parse(jsonInput.value.trim());
        configToSave = {
          databaseURL: parsed.databaseURL || configToSave.databaseURL,
          apiKey: parsed.apiKey || configToSave.apiKey,
          projectId: parsed.projectId || configToSave.projectId,
        };
      } catch {
        alert('تنسيق كود JSON غير صالح، تم استخدام الحقول الفردية.');
      }
    }

    if (!configToSave.databaseURL) {
      alert('يرجى كتابة رابط قاعدة البيانات databaseURL (مثال: https://my-app-default-rtdb.firebaseio.com)');
      return;
    }

    import('./firebase').then(fb => {
      const ok = fb.saveFirebaseConfig(configToSave);
      if (ok) {
        alert('✅ تم حفظ إعدادات قاعدة البيانات وربطها بنجاح!');
        window.closeDatabaseSettings();
        window.location.reload();
      } else {
        alert('⚠️ تم حفظ الرابط، وسيتم الاتصال تلقائياً عند توفر الإنترنت.');
        window.closeDatabaseSettings();
      }
    });
  };

  // Upload Settings Handlers
  window.openUploadSettings = () => {
    const modal = document.getElementById('upload-settings-modal');
    if (!modal) return;
    const urlInput = document.getElementById('upload-url-input') as HTMLInputElement;
    const currentUrl = getUploadApiUrl();
    if (urlInput) urlInput.value = currentUrl;
    modal.classList.add('active');
  };

  window.closeUploadSettings = () => {
    const modal = document.getElementById('upload-settings-modal');
    if (modal) modal.classList.remove('active');
  };

  window.saveUploadSettings = () => {
    const urlInput = document.getElementById('upload-url-input') as HTMLInputElement;
    if (urlInput) {
      saveUploadApiUrl(urlInput.value);
      alert('✅ تم حفظ رابط مركز رفع الصور والفيديوهات بنجاح!');
      window.closeUploadSettings();
    }
  };

  window.selectUploadPreset = (url: string) => {
    const urlInput = document.getElementById('upload-url-input') as HTMLInputElement;
    if (urlInput) urlInput.value = url;
  };

  window.quickLoginAs = (type: 'owner' | 'guest') => {
    if (type === 'owner') {
      const ownerUser = getUsers().find(u => u.role === 'owner') || {
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
      };
      saveCurrentUser(ownerUser);
      initApplication();
    } else {
      const randomGuest = 'عضو_' + Math.floor(100 + Math.random() * 900);
      performLogin(randomGuest);
      initApplication();
    }
  };

  // Login Button Click
  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('username-input') as HTMLInputElement;

  if (loginBtn && usernameInput) {
    loginBtn.onclick = () => {
      const success = performLogin(usernameInput.value);
      if (success) {
        initApplication();
      }
    };

    usernameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const success = performLogin(usernameInput.value);
        if (success) {
          initApplication();
        }
      }
    };
  }
}

function renderUsersModalList(searchQuery = '') {
  const container = document.getElementById('users-list');
  if (!container) return;

  const users = getUsers().filter(u => !u.isHidden);
  const currentUser = getCurrentUser();
  const filtered = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  container.innerHTML = '';
  filtered.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.role = user.role;

    card.innerHTML = `
      <div class="user-info">
        <img src="${user.avatar}" class="user-avatar" onclick="window.onStartDM('${user.id}')" alt="">
        <div class="user-details">
          <h4>
            <span>${user.name}</span>
            <span class="role-badge ${user.role}">${user.role}</span>
          </h4>
          <span class="last-seen">${user.status === 'online' ? '🟢 متصل الآن' : '⚪ غير متصل'}</span>
        </div>
      </div>
      <div class="user-actions">
        ${currentUser && currentUser.id !== user.id ? `
          <button class="ctrl-btn dm" onclick="window.onStartDM('${user.id}')" title="محادثة خاصة">💌</button>
        ` : ''}
        ${currentUser && currentUser.role === 'owner' && currentUser.id !== user.id ? `
          <button class="ctrl-btn role" onclick="window.onPromoteUser('${user.id}')" title="تغيير الرتبة">⚙️</button>
          <button class="ctrl-btn mute" onclick="window.onMuteUser('${user.id}')" title="كتم">🔇</button>
          <button class="ctrl-btn ban" onclick="window.onBanUser('${user.id}')" title="حظر">🚫</button>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}
