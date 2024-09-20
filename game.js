// game.js — игровая логика

let localTank;
let remoteTank = { x: 0, y: 0, width: 40, height: 40, color: 'red' };
let gameStarted = false;
let receivedInitialPosition = false;
let sentInitialPosition = false;

// Конфигурация игрового поля
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Инициализация игры
export function initializeGame(receivedData) {
    if (roleSelection.value === 'host') {
        localTank = { x: 100, y: 100, width: 40, height: 40, color: 'green' };
    } else {
        localTank = { x: 600, y: 400, width: 40, height: 40, color: 'blue' };
    }
    remoteTank.x = receivedData.x;
    remoteTank.y = receivedData.y;
}

// Отправка начальной позиции
export function sendInitialPosition() {
    if (!sentInitialPosition) {
        sendData(localTank);
        sentInitialPosition = true;
    }
}

// Обработка нажатий клавиш для управления танком
export function handleKeyPress(event) {
    if (gameStarted) {
        switch (event.key) {
            case 'ArrowUp':
                localTank.y -= 5;
                break;
            case 'ArrowDown':
                localTank.y += 5;
                break;
            case 'ArrowLeft':
                localTank.x -= 5;
                break;
            case 'ArrowRight':
                localTank.x += 5;
                break;
        }
        sendData(localTank);
        updateGame();
    }
}

// Начало игры
export function startGame() {
    if (receivedInitialPosition && sentInitialPosition) {
        gameCanvas.classList.remove('hidden');
        updateStatus("Игра началась!");
        gameStarted = true;
        updateGame();
        autoHideSettings();  // Скрываем блок настроек
    }
}

// Обновление игры
export function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Границы игрового поля
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Отрисовка локального танка
    ctx.fillStyle = localTank.color;
    ctx.fillRect(localTank.x, localTank.y, localTank.width, localTank.height);

    // Отрисовка удалённого танка
    ctx.fillStyle = remoteTank.color;
    ctx.fillRect(remoteTank.x, remoteTank.y, remoteTank.width, remoteTank.height);
}
