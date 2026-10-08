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
const authForm = document.getElementById('authForm');
const telegramWidgetWrapper = document.getElementById('telegramWidgetWrapper');
const telegramMessage = document.getElementById('telegramMessage');
const profileUsername = document.getElementById('profileUsername');
const packagesCount = document.getElementById('packagesCount');
const balanceValue = document.getElementById('balanceValue');
const ratingValue = document.getElementById('ratingValue');

const TELEGRAM_BOT_USERNAME = 'arzmodsbot';
let activeFilter = 'all';

function renderCounters(profile) {
  if (!profile) return;

  if (packagesCount) {
    packagesCount.textContent = String(profile.packagesCount ?? 6).padStart(2, '0');
  }

  if (balanceValue) {
    balanceValue.textContent = `$${Number(profile.balance ?? 420)}`;
  }

  if (ratingValue) {
    ratingValue.textContent = Number(profile.rating ?? 4.9).toFixed(1);
  }
}

async function loadProfile() {
  try {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    const profile = data?.profile || null;

    if (!profile) {
      return;
    }

    renderCounters(profile);

    if (profile.nickname) {
      const input = authForm?.querySelector('input[name="nickname"]');
      if (input) input.value = profile.nickname;
      if (profileUsername) profileUsername.textContent = profile.nickname;
    }

    if (profile.telegram) {
      const input = authForm?.querySelector('input[name="telegram"]');
      if (input) input.value = profile.telegram;
    }

    if (profile.discord) {
      const input = authForm?.querySelector('input[name="discord"]');
      if (input) input.value = profile.discord;
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
    telegramWidgetWrapper.classList.add('visible');
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
  const telegram = user.username ? `@${user.username}` : `id:${user.id}`;

  const nicknameInput = authForm?.querySelector('input[name="nickname"]');
  const telegramInput = authForm?.querySelector('input[name="telegram"]');

  if (nicknameInput) nicknameInput.value = nickname;
  if (telegramInput) telegramInput.value = telegram;
  if (profileUsername) profileUsername.textContent = nickname;

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
    if (profileUsername) profileUsername.textContent = result.profile.nickname;
    renderCounters(result.profile);
  } catch (error) {
    telegramMessage.textContent = 'Telegram авторизація не пройшла перевірку. Перевірте конфігурацію бота.';
  }
};

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

searchInput.addEventListener('input', renderMods);

if (authForm) {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(authForm);
    const payload = {
      nickname: formData.get('nickname')?.toString().trim() || '',
      telegram: formData.get('telegram')?.toString().trim() || '',
      discord: formData.get('discord')?.toString().trim() || '',
      authSource: 'manual'
    };

    if (!payload.nickname || !payload.telegram) {
      telegramMessage.textContent = 'Укажіть нікнейм і Telegram ID.';
      return;
    }

    const submitButton = authForm.querySelector('.auth-submit');
    submitButton.textContent = 'Збереження...';
    submitButton.disabled = true;

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      submitButton.textContent = 'Профіль збережено';
      if (profileUsername) profileUsername.textContent = payload.nickname;
      telegramMessage.textContent = 'Профіль успішно збережено на сервері.';
      renderCounters(result.profile);
    }

    submitButton.disabled = false;
  });
}

initTelegramLogin();
loadProfile();
renderMods();
