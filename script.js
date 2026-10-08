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
const telegramLoginBtn = document.getElementById('telegramLoginBtn');
const telegramWidgetWrapper = document.getElementById('telegramWidgetWrapper');
const TELEGRAM_BOT_USERNAME = 'arzmodsbot';

let activeFilter = 'all';

function initTelegramLogin() {
  if (!telegramWidgetWrapper || !telegramLoginBtn || !TELEGRAM_BOT_USERNAME || TELEGRAM_BOT_USERNAME === 'YOUR_BOT_USERNAME') {
    return;
  }

  const existingScript = document.querySelector('script[data-telegram-login]');
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '18');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  telegramWidgetWrapper.appendChild(script);
  telegramWidgetWrapper.classList.add('visible');

  telegramLoginBtn.addEventListener('click', () => {
    const telegramButton = telegramWidgetWrapper.querySelector('a.telegram-login-button, iframe, button');
    if (telegramButton) {
      telegramButton.click();
    }
  });
}

window.onTelegramAuth = (user) => {
  if (!user) {
    return;
  }

  const nicknameInput = authForm?.querySelector('input[name="nickname"]');
  const telegramInput = authForm?.querySelector('input[name="telegram"]');

  if (nicknameInput && user.first_name) {
    nicknameInput.value = user.username || user.first_name;
  }

  if (telegramInput && user.id) {
    telegramInput.value = user.username ? `@${user.username}` : `id:${user.id}`;
  }

  const submitButton = authForm?.querySelector('.auth-submit');
  if (submitButton) {
    submitButton.textContent = 'Telegram підключено';
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
initTelegramLogin();

if (authForm) {
  authForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(authForm);
    const nickname = formData.get('nickname')?.toString().trim();
    const telegram = formData.get('telegram')?.toString().trim();

    if (!nickname || !telegram) {
      return;
    }

    const submitButton = authForm.querySelector('.auth-submit');
    submitButton.textContent = 'Профіль збережено';
    submitButton.disabled = true;
    submitButton.style.opacity = '0.8';
  });
}

renderMods();
