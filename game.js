// game.js — игровая логика

import { sendData } from './webrtc.js';  // Импортируем функцию sendData
import { updateStatus } from './interface.js';  // Импортируем функцию updateStatus

let localTank;
export let remoteTank = { x: 0, y: 0, width: 40, height: 40, color: 'red' };  // Экспортируем удалённый танк
export let receivedInitialPosition = false;
export let sentInitialPosition = false;
let gameStarted = false;

// Конфигурация игрового поля
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Инициализация игры
export function initializeGame(receivedData) {
    console.log("Инициализация игры с полученными данными:", receivedData);
    
    // Выбор роли (хост или гость)
    const roleSelection = document.querySelector('input[name="role"]:checked');
    
    // Проверка, что роль выбрана и танк инициализируется корректно
    if (roleSelection && roleSelection.value === 'host') {
        localTank = { x: 100, y: 100, width: 40, height: 40, color: 'green' };
        console.log("Инициализирован танк для хоста:", localTank);
    } else {
        localTank = { x: 600, y: 400, width: 40, height: 40, color: 'blue' };
        console.log("Инициализирован танк для гостя:", localTank);
    }

    // Если мы получили начальные данные от удалённого игрока, обновляем его танк
    if (receivedData && receivedData.x !== undefined) {
        remoteTank.x = receivedData.x;
        remoteTank.y = receivedData.y;
        remoteTank.width = receivedData.width;
        remoteTank.height = receivedData.height;
        remoteTank.color = receivedData.color;
        console.log("Удалённый танк обновлен:", remoteTank);
    }

    receivedInitialPosition = true;  // Помечаем, что получена начальная позиция
    console.log("Начальная позиция получена.");
}

// Отправка начальной позиции локального танка
export function sendInitialPosition() {
    if (!sentInitialPosition && localTank) {
        console.log("Отправляем начальную позицию:", localTank);
        sendData(localTank);  // Отправляем данные о локальном танке
        sentInitialPosition = true;
    } else {
        console.warn("Начальная позиция не отправлена: localTank не инициализирован.");
    }
}

// Обработка нажатий клавиш для управления локальным танком
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
        sendData(localTank);  // Отправляем только данные о локальном танке
        updateGame();
    }
}

// Начало игры
export function startGame() {
    if (receivedInitialPosition && sentInitialPosition) {
        console.log("Начинаем игру. Отображаем игровое поле.");
        document.getElementById('gameCanvas').classList.remove('hidden');  // Показываем игровое поле
        updateStatus("Игра началась!");
        gameStarted = true;
        updateGame();
    } else {
        console.log("Не готовы начать игру. Ждем получения и отправки начальных позиций.");
    }
}

// Обновление игрового поля
export function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Границы игрового поля
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Отрисовка локального танка (ваш танк)
    ctx.fillStyle = localTank.color;
    ctx.fillRect(localTank.x, localTank.y, localTank.width, localTank.height);

    // Отрисовка удалённого танка (танк другого игрока)
    ctx.fillStyle = remoteTank.color;
    ctx.fillRect(remoteTank.x, remoteTank.y, remoteTank.width, remoteTank.height);
}
