// frontend/js/script.js
document.addEventListener('DOMContentLoaded', () => {
  // Элементы интерфейса
  const grid = document.getElementById('rouletteGrid');
  const playBtn = document.getElementById('playButton');
  const betAmount = document.getElementById('betAmount');
  const resultDiv = document.getElementById('result');
  const balanceSpan = document.getElementById('balance');
  const usernameSpan = document.getElementById('username');
  const logoutBtn = document.getElementById('logout');
  const hashInput = document.getElementById('hashInput');
  const verifyBtn = document.getElementById('verifyButton');
  const historyBody = document.querySelector('#historyTable tbody');
  
  // Модальные окна
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const closeBtns = document.querySelectorAll('.close');
  
  // Формы
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Данные приложения
  let selectedCells = [];
  let currentUser = null;
  
  // Инициализация игрового поля
  function initGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 99; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = i;
      cell.dataset.number = i;
      
      cell.addEventListener('click', () => {
        if (cell.classList.contains('selected')) {
          cell.classList.remove('selected');
          selectedCells = selectedCells.filter(num => num !== i);
        } else if (selectedCells.length < 3) {
          cell.classList.add('selected');
          selectedCells.push(i);
        }
      });
      
      grid.appendChild(cell);
    }
  }
  
  // Обновление информации о пользователе
  function updateUserInfo(user) {
    if (user) {
      usernameSpan.textContent = user.username;
      balanceSpan.textContent = `$${user.balance.toFixed(2)}`;
      logoutBtn.style.display = 'block';
      currentUser = user;
      loadHistory();
    } else {
      usernameSpan.textContent = 'Гость';
      balanceSpan.textContent = '$0.00';
      logoutBtn.style.display = 'none';
      currentUser = null;
      historyBody.innerHTML = '';
    }
  }
  
  // Загрузка истории ставок
  async function loadHistory() {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/user/${currentUser.id}/bets`);
      if (response.ok) {
        const bets = await response.json();
        historyBody.innerHTML = '';
        
        bets.forEach(bet => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${new Date(bet.timestamp).toLocaleString()}</td>
            <td>${bet.selected_cells}</td>
            <td>${bet.winning_cell}</td>
            <td>$${bet.amount.toFixed(2)}</td>
            <td class="${bet.prize > 0 ? 'win' : 'loss'}">$${bet.prize.toFixed(2)}</td>
            <td>${bet.game_hash.substring(0, 12)}...</td>
          `;
          historyBody.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  }
  
  // Показать модальное окно
  function showModal(modal) {
    modal.style.display = 'block';
  }
  
  // Скрыть модальное окно
  function hideModal(modal) {
    modal.style.display = 'none';
  }
  
  // Инициализация приложения
  function initApp() {
    initGrid();
    updateUserInfo(null);
    
    // Проверить авторизацию при загрузке
    fetch('/api/user')
      .then(response => response.json())
      .then(user => updateUserInfo(user))
      .catch(() => updateUserInfo(null));
  }
  
  // Обработчики событий
  playBtn.addEventListener('click', async () => {
    if (!currentUser) {
      showModal(loginModal);
      return;
    }
    
    if (selectedCells.length === 0) {
      alert('Выберите хотя бы одну ячейку!');
      return;
    }
    
    const amount = parseFloat(betAmount.value);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму ставки');
      return;
    }
    
    try {
      const response = await fetch('/api/place_bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cells: selectedCells,
          amount: amount
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Обновить UI
        balanceSpan.textContent = `$${result.new_balance.toFixed(2)}`;
        
        // Показать результат
        const allCells = document.querySelectorAll('.cell');
        allCells.forEach(cell => {
          cell.classList.remove('winning');
          if (parseInt(cell.dataset.number) === result.winning_cell) {
            cell.classList.add('winning');
          }
        });
        
        if (result.is_winner) {
          resultDiv.innerHTML = `
            <h3>🎉 Поздравляем! Вы выиграли $${result.prize.toFixed(2)}</h3>
            <p>Выигрышная ячейка: <strong>${result.winning_cell}</strong></p>
            <p>Хеш игры: <code>${result.game_hash}</code></p>
          `;
        } else {
          resultDiv.innerHTML = `
            <h3>😢 Увы, не в этот раз</h3>
            <p>Выигрышная ячейка: <strong>${result.winning_cell}</strong></p>
            <p>Хеш игры: <code>${result.game_hash}</code></p>
          `;
        }
        
        // Обновить историю
        loadHistory();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка ставки:', error);
      alert('Ошибка при выполнении ставки');
    }
  });
  
  // Остальные обработчики событий...
  // (логин, регистрация, выход, проверка хеша и т.д.)
  
  // Инициализация
  initApp();
});
