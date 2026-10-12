import { PendingRegistration, User } from './types';
import { getCurrentUser, getDeviceId, getPendingRegistrations, getSettings, getUsers, saveCurrentUser, savePendingRegistrations, saveUsers } from './storage';

let verifiedPhoneNumber: string | null = null;

export function getVerifiedPhone(): string | null {
  return verifiedPhoneNumber;
}

export function setVerifiedPhone(phone: string | null): void {
  verifiedPhoneNumber = phone;
  const badge = document.getElementById('login-phone-badge');
  if (badge) badge.textContent = phone || '-';
}

export function checkAuthStateOnStartup(): void {
  const loadingScreen = document.getElementById('loading-screen');
  const loginScreen = document.getElementById('login-screen');
  const verifyScreen = document.getElementById('verify-screen');
  const banScreen = document.getElementById('ban-screen');
  const maintenanceScreen = document.getElementById('maintenance-screen');
  const pendingScreen = document.getElementById('pending-approval-screen');

  const settings = getSettings();
  const currentUser = getCurrentUser();

  // Hide loading screen after 400ms
  setTimeout(() => {
    if (loadingScreen) loadingScreen.style.display = 'none';

    // 1. Check if user is logged in
    if (currentUser) {
      // Check if banned
      if (currentUser.isBanned) {
        if (banScreen) banScreen.style.display = 'flex';
        return;
      }

      // Check maintenance mode
      if (settings.maintenanceMode) {
        const isTester = settings.testers.includes(currentUser.id) || currentUser.role === 'owner';
        if (!isTester) {
          if (maintenanceScreen) {
            const mText = document.getElementById('maintenance-text');
            if (mText) mText.textContent = settings.maintenanceMessage;
            maintenanceScreen.style.display = 'flex';
          }
          return;
        }
      }

      // User is verified and active!
      // Keep screens hidden, app is visible
      return;
    }

    // 2. Not logged in: Check verification gate
    if (settings.verificationGateEnabled && !verifiedPhoneNumber) {
      if (verifyScreen) {
        verifyScreen.style.display = 'flex';
        verifyScreen.classList.add('active');
      }
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
    }
  }, 400);
}

// Telegram Bot Verification Simulation
export function startTelegramVerification(): void {
  const stepStart = document.getElementById('verify-step-start');
  const stepLink = document.getElementById('verify-step-link');
  const dot1 = document.getElementById('vstep1');
  const dot2 = document.getElementById('vstep2');

  if (stepStart) stepStart.style.display = 'none';
  if (stepLink) stepLink.style.display = 'block';

  if (dot1) {
    dot1.classList.remove('active');
    dot1.classList.add('done');
  }
  if (dot2) {
    dot2.classList.add('active');
  }
}

export function verifyTelegramContactSuccess(): void {
  const stepLink = document.getElementById('verify-step-link');
  const stepSuccess = document.getElementById('verify-step-success');
  const phoneDisplay = document.getElementById('verified-phone-display');

  // Simulated authenticated phone
  const simulatedPhone = '+9665' + Math.floor(10000000 + Math.random() * 90000000);
  setVerifiedPhone(simulatedPhone);

  if (stepLink) stepLink.style.display = 'none';
  if (stepSuccess) stepSuccess.style.display = 'block';
  if (phoneDisplay) phoneDisplay.textContent = simulatedPhone;

  // After 1.5 seconds, transition to login screen or register
  setTimeout(() => {
    const verifyScreen = document.getElementById('verify-screen');
    const loginScreen = document.getElementById('login-screen');

    if (verifyScreen) {
      verifyScreen.classList.remove('active');
      verifyScreen.style.display = 'none';
    }
    if (loginScreen) {
      loginScreen.style.display = 'flex';
    }
  }, 1500);
}

export function performLogin(username: string): boolean {
  const trimmed = username.trim();
  const errorBox = document.getElementById('login-error-box');
  const errorText = document.getElementById('login-error-text');

  if (trimmed.length < 2) {
    if (errorBox && errorText) {
      errorText.textContent = 'يجب أن يتكون الاسم من حرفين على الأقل.';
      errorBox.classList.add('show');
    }
    return false;
  }

  const settings = getSettings();
  const phone = verifiedPhoneNumber || '+9665' + Math.floor(10000000 + Math.random() * 90000000);

  // Check if auto registration is disabled
  if (!settings.autoRegistrationEnabled) {
    // Submit pending registration request
    const pendingList = getPendingRegistrations();
    const newReq: PendingRegistration = {
      id: 'reg_' + Date.now(),
      name: trimmed,
      phone,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmed)}`,
      timestamp: Date.now(),
      status: 'pending',
    };
    pendingList.push(newReq);
    savePendingRegistrations(pendingList);

    // Show pending approval screen
    const loginScreen = document.getElementById('login-screen');
    const pendingScreen = document.getElementById('pending-approval-screen');
    const detailsContent = document.getElementById('pending-details-content');

    if (loginScreen) loginScreen.style.display = 'none';
    if (pendingScreen) {
      pendingScreen.style.display = 'flex';
      pendingScreen.classList.add('active');
    }
    if (detailsContent) {
      detailsContent.innerHTML = `الاسم: <b>${trimmed}</b> | الهاتف: <b>${phone}</b>`;
    }
    return false;
  }

  // Auto create or log in user
  const users = getUsers();
  let user = users.find(u => u.name.toLowerCase() === trimmed.toLowerCase());

  if (!user) {
    user = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      phone,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmed)}`,
      status: 'online',
      lastSeen: Date.now(),
      capabilities: { canDM: true, canMedia: true, canStatus: true, canChat: true }
    };
    users.push(user);
    saveUsers(users);
  } else {
    user.status = 'online';
    user.lastSeen = Date.now();
  }

  saveCurrentUser(user);

  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'none';

  return true;
}

export function performLogout(): void {
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.status = 'offline';
    currentUser.lastSeen = Date.now();
    const users = getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) users[idx] = currentUser;
    saveUsers(users);
  }

  saveCurrentUser(null);
  window.location.reload();
}
