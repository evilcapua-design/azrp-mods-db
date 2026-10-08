const mods = [
  {
    name: 'Legend HUD',
    type: 'ui',
    status: 'Popular',
    price: '$0',
    description: 'Розширений HUD для сервера з індикаторами грошових коштів, банд, HP і швидкого доступу до статистики.',
    tags: ['HUD', 'RP', 'Stats'],
  },
  {
    name: 'Night Drive FX',
    type: 'graphics',
    status: 'New',
    price: '$4',
    description: 'Тонка настройка освітлення, уповільнення відблисків і атмосфери для нічних вуличних перегонів.',
    tags: ['Light', 'Night', 'Vehicles'],
  },
  {
    name: 'Quick Job Panel',
    type: 'utility',
    status: 'Stable',
    price: '$0',
    description: 'Набір скорочень для роботи, відстеження завдань, фракцій і швидкого виконання активностей.',
    tags: ['Jobs', 'Utility', 'QOL'],
  },
  {
    name: 'Combat Assist',
    type: 'gameplay',
    status: 'Pro',
    price: '$6',
    description: 'Утиліта для кращої орієнтації під час бою, анімацій і швидких комбінацій для підготовки до RP-взаємодій.',
    tags: ['Combat', 'Action', 'Aim'],
  },
  {
    name: 'Business Core',
    type: 'utility',
    status: 'Top',
    price: '$5',
    description: 'Центральна панель для бізнесів, доходів, логістики, розкладу і кредитів без зайвих вкладень.',
    tags: ['Business', 'Economy', 'Panel'],
  },
  {
    name: 'Metro Color Pro',
    type: 'graphics',
    status: 'Hot',
    price: '$3',
    description: 'Оптимізований пресет для чітких відтінків, якісної графіки та плавного відображення вулиць.',
    tags: ['Color', 'Graphics', 'UI'],
  },
];

const modsGrid = document.getElementById('modsGrid');
const filterButtons = document.querySelectorAll('.filter-chip');
const searchInput = document.getElementById('searchInput');
const openLoginDialog = document.getElementById('openLoginDialog');
const loginDialog = document.getElementById('loginDialog');
const closeLoginDialog = document.getElementById('closeLoginDialog');
const telegramWidgetWrapper = document.getElementById('telegramWidgetWrapper');
const telegramMessage = document.getElementById('telegramMessage');
const profileUsername = document.getElementById('profileUsername');
const profileSection = document.getElementById('profileSection');
const profileNavLink = document.getElementById('profileNavLink');
const accountContent = document.getElementById('accountContent');
const profileLoginPrompt = document.getElementById('profileLoginPrompt');
const profileLoginButton = document.getElementById('profileLoginButton');
const profileTelegram = document.getElementById('profileTelegram');
const profileAvatar = document.getElementById('profileAvatar');
const profileJoined = document.getElementById('profileJoined');
const profileNotice = document.getElementById('profileNotice');
const logoutButton = document.getElementById('logoutButton');

const TELEGRAM_BOT_USERNAME = 'arzmodsbot';
let activeFilter = 'all';
let currentProfile = null;

function renderProfile(profile) {
  currentProfile = profile;
  const nickname = profile.nickname || 'TelegramUser';
  const initials = [...nickname].slice(0, 2).join('').toUpperCase();

  if (profileUsername) profileUsername.textContent = nickname;
  if (profileTelegram) profileTelegram.textContent = profile.telegram || 'Telegram';
  if (profileAvatar) profileAvatar.textContent = initials || 'AZ';
  if (profileJoined) {
    const joined = profile.createdAt ? new Date(profile.createdAt) : null;
    profileJoined.textContent = joined && !Number.isNaN(joined.getTime())
      ? joined.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Дата недоступна';
  }
  if (openLoginDialog) openLoginDialog.textContent = nickname;
  if (accountContent) accountContent.hidden = false;
  if (profileLoginPrompt) profileLoginPrompt.hidden = true;
  if (profileNavLink) profileNavLink.hidden = false;
}

async function loadProfile() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error(`Dashboard request failed with status ${response.status}`);
    const data = await response.json();
    const profile = data?.profile || null;

    if (profile) {
      renderProfile(profile);
    } else if (profileLoginPrompt) {
      profileLoginPrompt.hidden = false;
    }
  } catch (error) {
    console.error('Failed to load dashboard profile', error);
  }
}

async function initTelegramLogin() {
  if (!telegramWidgetWrapper || !TELEGRAM_BOT_USERNAME) {
    return;
  }

  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Telegram config request failed with status ${response.status}`);
    }

    const config = await response.json();
    if (!config.telegramLoginEnabled) {
      telegramMessage.textContent = 'Вхід через Telegram тимчасово недоступний. Спробуйте пізніше.';
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', config.botUsername || TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '18');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.onerror = () => {
      telegramMessage.textContent = 'Не вдалося завантажити кнопку Telegram. Оновіть сторінку та спробуйте ще раз.';
    };
    telegramWidgetWrapper.appendChild(script);
    telegramMessage.textContent = 'Натисніть кнопку Telegram, щоб увійти.';
  } catch (error) {
    console.error('Failed to initialize Telegram Login', error);
    telegramMessage.textContent = 'Не вдалося підключити вхід через Telegram. Оновіть сторінку та спробуйте ще раз.';
  }
}

window.onTelegramAuth = async (user) => {
  if (!user) {
    telegramMessage.textContent = 'Не вдалося отримати дані з Telegram.';
    return;
  }

  const nickname = user.username || user.first_name || 'TelegramUser';

  try {
    const response = await fetch('/api/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Telegram validation failed');
    }

    telegramMessage.textContent = 'Telegram авторизація успішна. Профіль збережено.';
    loginDialog?.close();
    renderProfile(result.profile);
    if (!accountContent) window.location.assign('/profile.html');
  } catch (error) {
    console.error('Telegram authentication failed', error);
    telegramMessage.textContent = 'Telegram авторизація не пройшла перевірку. Перевірте конфігурацію бота.';
  }
};

openLoginDialog?.addEventListener('click', () => {
  if (currentProfile) {
    if (accountContent) {
      profileSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.assign('/profile.html');
    }
    return;
  }
  loginDialog?.showModal();
});
profileLoginButton?.addEventListener('click', () => loginDialog?.showModal());
closeLoginDialog?.addEventListener('click', () => loginDialog?.close());
loginDialog?.addEventListener('click', (event) => {
  if (event.target === loginDialog) {
    loginDialog.close();
  }
});

document.querySelectorAll('[data-profile-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    const selectedTab = button.dataset.profileTab;
    document.querySelectorAll('[data-profile-tab]').forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('[data-profile-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.profilePanel !== selectedTab;
    });
  });
});

logoutButton?.addEventListener('click', async () => {
  if (profileNotice) profileNotice.textContent = '';
  logoutButton.disabled = true;
  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) throw new Error(`Logout request failed with status ${response.status}`);
    currentProfile = null;
    if (accountContent) accountContent.hidden = true;
    if (profileLoginPrompt) profileLoginPrompt.hidden = false;
    if (profileNavLink) profileNavLink.hidden = true;
    if (openLoginDialog) openLoginDialog.textContent = 'Увійти';
    if (accountContent) {
      window.location.assign('/');
      return;
    }
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Failed to log out', error);
    if (profileNotice) profileNotice.textContent = 'Не вдалося вийти. Спробуйте ще раз.';
  } finally {
    logoutButton.disabled = false;
  }
});

function renderMods() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredMods = mods.filter((mod) => {
    const matchesFilter = activeFilter === 'all' || mod.type === activeFilter;
    const searchText = `${mod.name} ${mod.description} ${mod.tags.join(' ')}`.toLowerCase();
    const matchesSearch = searchText.includes(query);
    return matchesFilter && matchesSearch;
  });

  if (!filteredMods.length) {
    modsGrid.innerHTML = `
      <div class="empty-state">
        <h3>Нічого не знайдено</h3>
        <p>Спробуйте змінити пошуковий запит або вибрати іншу категорію.</p>
      </div>
    `;
    return;
  }

  modsGrid.innerHTML = filteredMods
    .map(
      (mod) => `
        <article class="mod-card">
          <div class="mod-cover" aria-hidden="true"></div>
          <div class="mod-meta">
            <span class="mod-type">${mod.type}</span>
            <span class="mod-status">${mod.status}</span>
          </div>
          <h3>${mod.name}</h3>
          <p>${mod.description}</p>
          <div class="mod-tags">
            ${mod.tags.map((tag) => `<span>${tag}</span>`).join('')}
          </div>
          <div class="mod-footer">
            <span class="mod-price">${mod.price}</span>
            <button class="mod-btn" type="button">Отримати</button>
          </div>
        </article>
      `
    )
    .join('');
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((chip) => chip.classList.toggle('active', chip === button));
    renderMods();
  });
});

searchInput?.addEventListener('input', renderMods);

initTelegramLogin();
loadProfile();
if (modsGrid && searchInput) renderMods();
