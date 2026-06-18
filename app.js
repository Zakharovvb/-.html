// ===== CONFIG =====
const GASCATALOGURL = 'https://script.google.com/macros/s/YOUR_APPS_SCRIPT_DEPLOY_ID/exec';
const DEMO_MODE = true; // Демо-режим до подключения Apps Script

const quiz = {
  current: 0,
  answers: {},
  steps: [
    {
      id: 'goal',
      question: 'Для чего нужен инструмент?',
      options: [
        { value: 'learning', label: 'Обучение и практика' },
        { value: 'production', label: 'Создание музыки и запись' },
        { value: 'stage', label: 'Концерты и выступления' }
      ]
    },
    {
      id: 'budget',
      question: 'Какой бюджет?',
      options: [
        { value: 'low', label: 'До 30 000 ₽' },
        { value: 'mid', label: '30 000 – 70 000 ₽' },
        { value: 'high', label: 'Свыше 70 000 ₽' }
      ]
    },
    {
      id: 'experience',
      question: 'Ваш уровень игры?',
      options: [
        { value: 'beginner', label: 'Начинающий' },
        { value: 'intermediate', label: 'Средний' },
        { value: 'advanced', label: 'Продвинутый' }
      ]
    },
    {
      id: 'format',
      question: 'Формат инструмента?',
      options: [
        { value: 'digital', label: 'Цифровое пианино' },
        { value: 'synth', label: 'Синтезатор' },
        { value: 'midi', label: 'MIDI-клавиатура' }
      ]
    }
  ]
};

let selectedPlan = null;
let selectedPlanAmount = 0;

// ===== DEMO DATA =====
const DEMO_MODELS = [
  { brand: 'YAMAHA', model: 'P-45B', price: 29990, keys: 88, type: 'digital' },
  { brand: 'CASIO', model: 'CDP-S110BK', price: 32900, keys: 88, type: 'digital' },
  { brand: 'ROLAND', model: 'FP-30X', price: 59990, keys: 88, type: 'digital' },
  { brand: 'KORG', model: 'B2', price: 34990, keys: 88, type: 'digital' },
  { brand: 'YAMAHA', model: 'PSR-E373', price: 18990, keys: 61, type: 'synth' },
  { brand: 'KORG', model: 'microKEY2-61', price: 12900, keys: 61, type: 'midi' }
];

// ===== START QUIZ =====
function startQuiz() {
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');
  renderStep();
}

// ===== RENDER STEP =====
function renderStep() {
  const step = quiz.steps[quiz.current];
  const container = document.getElementById('quiz-steps');
  
  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">Вопрос ${quiz.current + 1} из ${quiz.steps.length}</div>
      <h2>${step.question}</h2>
      <div class="options">
        ${step.options.map(opt => `
          <button class="option" onclick="selectOption('${step.id}','${opt.value}')">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== SELECT OPTION =====
function selectOption(stepId, value) {
  quiz.answers[stepId] = value;
  
  document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
  
  setTimeout(() => {
    if (quiz.current < quiz.steps.length - 1) {
      quiz.current++;
      renderStep();
    } else {
      showResults();
    }
  }, 300);
}

// ===== SHOW RESULTS =====
function showResults() {
  document.getElementById('quiz').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  
  if (DEMO_MODE) {
    renderDemoResults();
  } else {
    fetchResultsFromGAS();
  }
}

// ===== DEMO RESULTS =====
function renderDemoResults() {
  const filtered = DEMO_MODELS.filter(m => {
    const budgetMatch = checkBudgetMatch(m.price);
    const formatMatch = m.type === quiz.answers.format || quiz.answers.format === 'digital';
    return budgetMatch && formatMatch;
  }).slice(0, 6);
  
  renderCards(filtered, 2); // free preview = 2
}

function checkBudgetMatch(price) {
  const budget = quiz.answers.budget;
  if (budget === 'low') return price < 30000;
  if (budget === 'mid') return price >= 30000 && price < 70000;
  return price >= 70000;
}

// ===== FETCH FROM APPS SCRIPT =====
function fetchResultsFromGAS() {
  const url = `${GASCATALOGURL}?action=previewResult&${new URLSearchParams(quiz.answers).toString()}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.models) {
        renderCards(data.models, 2);
      }
    })
    .catch(err => {
      console.error('GAS fetch error:', err);
      renderDemoResults();
    });
}

// ===== RENDER CARDS =====
function renderCards(models, freeLimit) {
  const container = document.getElementById('result-cards');
  const paywall = document.getElementById('paywall');
  
  const cards = models.map((m, i) => {
    const locked = i >= freeLimit;
    return `
      <div class="card ${locked ? 'card-locked' : ''}">
        ${i === 0 ? '<span class="card-badge">Лучший</span>' : ''}
        <h3>${m.model}</h3>
        <div class="brand">${m.brand}</div>
        <div class="specs">
          Клавиш: ${m.keys || 88}<br/>
          Тип: ${m.type || 'digital'}
        </div>
        <div class="price">${m.price ? m.price.toLocaleString('ru') + ' ₽' : '—'}</div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `<div class="cards-grid">${cards}</div>`;
  
  if (models.length > freeLimit) {
    paywall.classList.remove('hidden');
  }
}

// ===== SELECT PLAN =====
function selectPlan(plan, amount) {
  selectedPlan = plan;
  selectedPlanAmount = amount;
  
  document.querySelectorAll('.plan').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('email-form').classList.remove('hidden');
}

// ===== SUBMIT ORDER =====
function submitOrder() {
  const email = document.getElementById('user-email').value;
  
  if (!email || !email.includes('@')) {
    alert('Введите корректный email');
    return;
  }
  
  if (!selectedPlan) {
    alert('Выберите тариф');
    return;
  }
  
  const orderData = {
    ...quiz.answers,
    plan: selectedPlan,
    email: email,
    amount: selectedPlanAmount
  };
  
  if (DEMO_MODE) {
    console.log('Демо-заказ:', orderData);
    showSuccess();
  } else {
    sendOrderToGAS(orderData);
  }
}

// ===== SEND ORDER TO GAS =====
function sendOrderToGAS(orderData) {
  const url = `${GASCATALOGURL}?action=createOrder`;
  
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess();
      } else {
        alert('Ошибка оформления. Попробуйте ещё раз.');
      }
    })
    .catch(err => {
      console.error('Order submit error:', err);
      alert('Ошибка отправки. Проверьте подключение.');
    });
}

// ===== SHOW SUCCESS =====
function showSuccess() {
  document.getElementById('result').classList.add('hidden');
  document.getElementById('success').classList.remove('hidden');
}
