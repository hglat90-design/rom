import { AppSettings, User } from './types';
import { getCurrentUser, getSettings, getUsers, saveCurrentUser, saveSettings, saveUsers } from './storage';
import { setupChatEffects } from './effects';

export const CHAT_BG_PRESETS = [
  { id: 'none', label: 'افتراضي', url: '' },
  { id: 'dark_wood', label: 'خشب داكن', url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=600&q=80' },
  { id: 'gradient_night', label: 'سماء ليلية', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80' },
  { id: 'marble', label: 'رخام فاخر', url: 'https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?auto=format&fit=crop&w=600&q=80' },
  { id: 'abstract_wave', label: 'موجات ملونة', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80' },
  { id: 'nature_calm', label: 'طبيعة هادئة', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
];

export const THEME_HEADER_PRESETS = [
  '#008069', '#128C7E', '#075E54', '#1E88E5', '#9C27B0', '#E53935',
  '#FF9800', '#2E7D32', '#37474F', '#000000', '#1A237E', '#880E4F'
];

export const THEME_BOTTOM_PRESETS = [
  '#ffffff', '#f5f5f5', '#efe7dd', '#e0e0e0', '#263238', '#1a1a1a'
];

export const NAME_ANIMATIONS = [
  { id: 'none', label: 'بدون حركة' },
  { id: 'name-anim-shine', label: 'لمعان ذهبي' },
  { id: 'name-anim-rainbow', label: 'طيف متدرج' },
  { id: 'name-anim-neon', label: 'توهج نيون' },
  { id: 'name-anim-fire', label: 'لهب ناري' },
  { id: 'name-anim-ice', label: 'صقيع جليدي' },
  { id: 'name-anim-gold', label: 'ذهب خالص' },
  { id: 'name-anim-pulse', label: 'نبض' },
  { id: 'name-anim-float', label: 'طفو خفيف' },
  { id: 'name-anim-glitch', label: 'تذبذب رقمي' },
  { id: 'name-anim-aurora', label: 'شفق قطبي' },
  { id: 'name-anim-cyberpunk', label: 'سايبر بانك' },
  { id: 'name-anim-sparkle', label: 'بريق نجوم' },
  { id: 'name-anim-3d', label: 'أبعاد ثلاثية' },
  { id: 'name-anim-bounce', label: 'قفز مرح' },
  { id: 'name-anim-heartbeat', label: 'نبضات قلب' },
  { id: 'name-anim-zoom', label: 'تكبير ناعم' },
];

export const EFFECT_PRESETS = [
  { id: 'none', label: 'بدون تأثير', icon: '🚫' },
  { id: 'stars', label: 'نجوم مضيئة', icon: '⭐' },
  { id: 'hearts', label: 'قلوب رومانسية', icon: '❤️' },
  { id: 'roses', label: 'بتلات الورد', icon: '🌹' },
  { id: 'snow', label: 'تساقط الثلوج', icon: '❄️' },
  { id: 'fire', label: 'شرارات النار', icon: '🔥' },
  { id: 'gold', label: 'عملات ذهبية', icon: '💰' },
  { id: 'bubbles', label: 'فقاعات مائية', icon: '🫧' },
  { id: 'confetti', label: 'احتفال وزينة', icon: '🎉' },
];

export function applyAppSettingsToDOM(settings: AppSettings): void {
  const root = document.documentElement;

  // Header and Bottom Nav colors
  root.style.setProperty('--header-bg', settings.headerBg || '#008069');
  root.style.setProperty('--header-text', settings.headerText || '#ffffff');
  root.style.setProperty('--bottom-nav-bg', settings.bottomBg || '#ffffff');
  root.style.setProperty('--bottom-nav-text', settings.bottomText || '#666666');

  // Background wallpapers
  root.style.setProperty(
    '--chat-bg-image',
    settings.generalBg ? `url("${settings.generalBg}")` : 'none'
  );
  root.style.setProperty(
    '--dm-bg-image',
    settings.dmBg ? `url("${settings.dmBg}")` : 'none'
  );

  // Message Animations
  root.style.setProperty('--msg-arrive-anim', settings.arriveAnim || 'fadeSlideIn');
  root.style.setProperty('--msg-send-anim', settings.sendAnim || 'sendPop');

  // Floating Particles
  setupChatEffects('chat-messages', settings.generalEffect);
  setupChatEffects('dm-chat-messages', settings.dmEffect);

  // Maintenance Badge
  const badge = document.getElementById('maintenance-badge');
  if (badge) {
    if (settings.maintenanceMode) {
      badge.textContent = `⚠️ وضع الصيانة مفعّل: ${settings.maintenanceMessage}`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

export function renderThemePresetPickers(): void {
  const headerContainer = document.getElementById('theme-header-presets');
  const bottomContainer = document.getElementById('theme-bottom-presets');
  const headerInput = document.getElementById('theme-header-bg') as HTMLInputElement;
  const bottomInput = document.getElementById('theme-bottom-bg') as HTMLInputElement;

  if (headerContainer && headerInput) {
    headerContainer.innerHTML = '';
    THEME_HEADER_PRESETS.forEach(color => {
      const box = document.createElement('div');
      box.className = 'theme-preset';
      box.style.backgroundColor = color;
      box.onclick = () => {
        headerInput.value = color;
        updateThemePreview();
      };
      headerContainer.appendChild(box);
    });
  }

  if (bottomContainer && bottomInput) {
    bottomContainer.innerHTML = '';
    THEME_BOTTOM_PRESETS.forEach(color => {
      const box = document.createElement('div');
      box.className = 'theme-preset';
      box.style.backgroundColor = color;
      box.onclick = () => {
        bottomInput.value = color;
        updateThemePreview();
      };
      bottomContainer.appendChild(box);
    });
  }
}

export function updateThemePreview(): void {
  const headerBg = (document.getElementById('theme-header-bg') as HTMLInputElement)?.value || '#008069';
  const headerText = (document.getElementById('theme-header-text') as HTMLInputElement)?.value || '#ffffff';
  const bottomBg = (document.getElementById('theme-bottom-bg') as HTMLInputElement)?.value || '#ffffff';
  const bottomText = (document.getElementById('theme-bottom-text') as HTMLInputElement)?.value || '#666666';

  const pHeader = document.getElementById('tp-header');
  const pBottom = document.getElementById('tp-bottom');

  if (pHeader) {
    pHeader.style.backgroundColor = headerBg;
    pHeader.style.color = headerText;
  }
  if (pBottom) {
    pBottom.style.backgroundColor = bottomBg;
    pBottom.style.color = bottomText;
  }
}

export function renderBackgroundPresets(): void {
  const genContainer = document.getElementById('general-bg-grid');
  const dmContainer = document.getElementById('dm-bg-grid');
  const settings = getSettings();

  const populateGrid = (container: HTMLElement | null, currentUrl: string, type: 'general' | 'dm') => {
    if (!container) return;
    container.innerHTML = '';

    CHAT_BG_PRESETS.forEach(preset => {
      const item = document.createElement('div');
      const isSelected = (!preset.url && !currentUrl) || preset.url === currentUrl;
      item.className = `bg-preset-item ${isSelected ? 'selected' : ''} ${!preset.url ? 'none-bg' : ''}`;

      if (preset.url) {
        item.style.backgroundImage = `url("${preset.url}")`;
      } else {
        item.textContent = 'افتراضي';
      }

      item.onclick = () => {
        if (type === 'general') {
          settings.generalBg = preset.url;
        } else {
          settings.dmBg = preset.url;
        }
        saveSettings(settings);
        applyAppSettingsToDOM(settings);
        renderBackgroundPresets();
      };

      container.appendChild(item);
    });
  };

  populateGrid(genContainer, settings.generalBg, 'general');
  populateGrid(dmContainer, settings.dmBg, 'dm');
}

export function renderEffectsPresets(): void {
  const genContainer = document.getElementById('general-effect-grid');
  const dmContainer = document.getElementById('dm-effect-grid');
  const settings = getSettings();

  const populateGrid = (container: HTMLElement | null, currentEffect: string, type: 'general' | 'dm') => {
    if (!container) return;
    container.innerHTML = '';

    EFFECT_PRESETS.forEach(effect => {
      const item = document.createElement('div');
      const isSelected = effect.id === currentEffect;
      item.className = `effect-option ${isSelected ? 'selected' : ''}`;

      item.innerHTML = `
        <span class="eff-icon">${effect.icon}</span>
        <span class="eff-name">${effect.label}</span>
      `;

      item.onclick = () => {
        if (type === 'general') {
          settings.generalEffect = effect.id;
        } else {
          settings.dmEffect = effect.id;
        }
        saveSettings(settings);
        applyAppSettingsToDOM(settings);
        renderEffectsPresets();
      };

      container.appendChild(item);
    });
  };

  populateGrid(genContainer, settings.generalEffect, 'general');
  populateGrid(dmContainer, settings.dmEffect, 'dm');
}

export function renderNameAnimationsGrid(selectedAnim: string, onSelect: (animId: string) => void): void {
  const container = document.getElementById('name-anim-grid');
  if (!container) return;

  container.innerHTML = '';
  NAME_ANIMATIONS.forEach(anim => {
    const btn = document.createElement('div');
    btn.className = `name-anim-btn ${anim.id === selectedAnim ? 'selected' : ''}`;

    btn.innerHTML = `
      <span class="anim-demo-text ${anim.id !== 'none' ? anim.id : ''}">فيسي برو</span>
      <span class="anim-name-label">${anim.label}</span>
    `;

    btn.onclick = () => {
      onSelect(anim.id);
    };

    container.appendChild(btn);
  });
}
