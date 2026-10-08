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
const profileTelegramId = document.getElementById('profileTelegramId');
const profileAvatar = document.getElementById('profileAvatar');
const profileJoined = document.getElementById('profileJoined');
const profileNotice = document.getElementById('profileNotice');
const adminSetupHint = document.getElementById('adminSetupHint');
const logoutButton = document.getElementById('logoutButton');
const adminPanelTab = document.getElementById('adminPanelTab');
const scriptUploadForm = document.getElementById('scriptUploadForm');
const scriptUploadSubmit = document.getElementById('scriptUploadSubmit');
const scriptUploadMessage = document.getElementById('scriptUploadMessage');
const myScriptsList = document.getElementById('myScriptsList');
const moderationQueue = document.getElementById('moderationQueue');
const communityScripts = document.getElementById('communityScripts');

const TELEGRAM_BOT_USERNAME = 'arzmodsbot';
let activeFilter = 'all';
let currentProfile = null;

function renderProfile(profile) {
  currentProfile = profile;
  const nickname = profile.nickname || 'TelegramUser';
  const initials = [...nickname].slice(0, 2).join('').toUpperCase();

  if (profileUsername) profileUsername.textContent = nickname;
  if (profileTelegram) profileTelegram.textContent = profile.telegram || 'Telegram';
  if (profileTelegramId) profileTelegramId.textContent = profile.telegramId || 'Недоступний — увійдіть через Telegram ще раз';
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
  if (adminPanelTab) adminPanelTab.hidden = !profile.isAdmin;
  if (adminSetupHint) adminSetupHint.hidden = profile.isAdmin || !profile.telegramId;
  if (myScriptsList) loadMyScripts();
  if (profile.isAdmin && moderationQueue) loadModerationQueue();
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

function createScriptEntry(script, { showStatus = false, admin = false } = {}) {
  const card = document.createElement('article');
  card.className = 'script-entry';

  const heading = document.createElement('h4');
  heading.textContent = script.title;
  const description = document.createElement('p');
  description.textContent = script.description;
  const details = document.createElement('p');
  details.className = 'script-entry-meta';
  details.textContent = `${script.fileName} · ${script.ownerNickname || 'Ви'} · ${new Date(script.createdAt).toLocaleDateString('uk-UA')}`;
  card.append(heading, description, details);

  if (showStatus) {
    const status = document.createElement('span');
    status.className = `script-status script-status-${script.status}`;
    status.textContent = {
      pending: 'Очікує модерації',
      approved: 'Схвалено',
      rejected: 'Відхилено'
    }[script.status] || script.status;
    card.appendChild(status);
    if (script.moderationNote) {
      const note = document.createElement('p');
      note.className = 'script-entry-note';
      note.textContent = script.moderationNote;
      card.appendChild(note);
    }
  }

  const actions = document.createElement('div');
  actions.className = 'script-entry-actions';
  if (admin) {
    const inspectLink = document.createElement('a');
    inspectLink.className = 'secondary-button script-action';
    inspectLink.href = `/api/admin/scripts/${encodeURIComponent(script.id)}/file`;
    inspectLink.textContent = 'Завантажити для перевірки';
    actions.appendChild(inspectLink);

    for (const status of ['approved', 'rejected']) {
      const button = document.createElement('button');
      button.className = status === 'approved' ? 'primary-button script-action' : 'account-logout script-action';
      button.type = 'button';
      button.textContent = status === 'approved' ? 'Схвалити' : 'Відхилити';
      button.addEventListener('click', async () => {
        const note = status === 'rejected'
          ? window.prompt('Причина відхилення (буде видна автору):', '')
          : '';
        if (status === 'rejected' && note === null) return;
        button.disabled = true;
        try {
          const response = await fetch(`/api/admin/scripts/${encodeURIComponent(script.id)}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, note })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Не вдалося зберегти рішення модерації');
          await loadModerationQueue();
          if (status === 'approved') await loadPublicScripts();
          await loadMyScripts();
        } catch (error) {
          console.error('Script moderation failed', error);
          if (profileNotice) profileNotice.textContent = error.message;
          button.disabled = false;
        }
      });
      actions.appendChild(button);
    }
  } else if (!showStatus) {
    const downloadLink = document.createElement('a');
    downloadLink.className = 'primary-button script-action';
    downloadLink.href = `/api/scripts/${encodeURIComponent(script.id)}/download`;
    downloadLink.textContent = 'Завантажити';
    actions.appendChild(downloadLink);
  }

  if (actions.childElementCount) card.appendChild(actions);
  return card;
}

async function loadMyScripts() {
  if (!myScriptsList) return;
  try {
    const response = await fetch('/api/scripts/mine');
    if (!response.ok) throw new Error(`Script list request failed with status ${response.status}`);
    const data = await response.json();
    myScriptsList.replaceChildren();
    if (!data.scripts.length) {
      const empty = document.createElement('p');
      empty.className = 'script-list-empty';
      empty.textContent = 'Ви ще не надсилали скриптів.';
      myScriptsList.appendChild(empty);
      return;
    }
    data.scripts.forEach((script) => myScriptsList.appendChild(createScriptEntry(script, { showStatus: true })));
  } catch (error) {
    console.error('Failed to load submitted scripts', error);
    myScriptsList.textContent = 'Не вдалося завантажити ваші скрипти. Оновіть сторінку та спробуйте ще раз.';
  }
}

async function loadModerationQueue() {
  if (!moderationQueue) return;
  try {
    const response = await fetch('/api/admin/scripts');
    if (!response.ok) throw new Error(`Moderation queue request failed with status ${response.status}`);
    const data = await response.json();
    moderationQueue.replaceChildren();
    if (!data.scripts.length) {
      const empty = document.createElement('p');
      empty.className = 'script-list-empty';
      empty.textContent = 'Черга модерації порожня.';
      moderationQueue.appendChild(empty);
      return;
    }
    data.scripts.forEach((script) => moderationQueue.appendChild(createScriptEntry(script, { admin: true })));
  } catch (error) {
    console.error('Failed to load moderation queue', error);
    moderationQueue.textContent = 'Не вдалося завантажити чергу модерації.';
  }
}

async function loadPublicScripts() {
  if (!communityScripts) return;
  try {
    const response = await fetch('/api/scripts');
    if (!response.ok) throw new Error(`Published script request failed with status ${response.status}`);
    const data = await response.json();
    communityScripts.replaceChildren();
    if (!data.scripts.length) {
      const empty = document.createElement('p');
      empty.className = 'script-list-empty';
      empty.textContent = 'Поки немає скриптів, схвалених модератором.';
      communityScripts.appendChild(empty);
      return;
    }
    data.scripts.forEach((script) => communityScripts.appendChild(createScriptEntry(script)));
  } catch (error) {
    console.error('Failed to load published scripts', error);
    communityScripts.textContent = 'Не вдалося завантажити скрипти спільноти.';
  }
}

scriptUploadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!scriptUploadForm.reportValidity()) return;
  const formData = new FormData(scriptUploadForm);
  const file = formData.get('scriptFile');
  if (!(file instanceof File) || file.size === 0) {
    scriptUploadMessage.textContent = 'Виберіть файл скрипту.';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    scriptUploadMessage.textContent = 'Файл має бути не більшим за 2 МБ.';
    return;
  }

  const query = new URLSearchParams({
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    fileName: file.name
  });
  scriptUploadSubmit.disabled = true;
  scriptUploadMessage.textContent = 'Надсилаємо файл…';
  try {
    const response = await fetch(`/api/scripts?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Не вдалося надіслати скрипт');
    scriptUploadForm.reset();
    scriptUploadMessage.textContent = result.message;
    await loadMyScripts();
  } catch (error) {
    console.error('Script upload failed', error);
    scriptUploadMessage.textContent = error.message || 'Помилка завантаження. Спробуйте ще раз.';
  } finally {
    scriptUploadSubmit.disabled = false;
  }
});

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

if (communityScripts) loadPublicScripts();

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
