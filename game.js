import { createHostConnection, createGuestConnection, sendData, setOnMessageReceived, setAnswerForHost, addIceCandidate } from './webrtc.js';

// Элементы для подключения WebRTC
const createOfferButton = document.getElementById('create-offer');
const setOfferButton = document.getElementById('set-offer');
const setAnswerButton = document.getElementById('set-answer');
const addHostIceButton = document.getElementById('add-host-ice');
const addClientIceButton = document.getElementById('add-client-ice');
const roleSelection = document.getElementById('role-selection');
const hostSection = document.getElementById('host-section');
const clientSection = document.getElementById('client-section');
const gameCanvas = document.getElementById('gameCanvas');
const connectionStatus = document.getElementById('connection-status');

// Кнопки копирования
const copyOfferButton = document.getElementById('copy-offer');
const copyAnswerButton = document.getElementById('copy-answer');
const copyHostIceButton = document.getElementById('copy-host-ice');
const copyClientIceButton = document.getElementById('copy-client-ice');

// Поля для ввода данных
const remoteAnswerInput = document.getElementById('remote-answer');
const remoteOfferInput = document.getElementById('remote-offer');
const hostIceInput = document.getElementById('remote-host-ice');
const clientIceInput = document.getElementById('remote-client-ice');

// Функция для обновления статуса
function updateStatus(status) {
    connectionStatus.textContent = status;
    console.log(status);
}

// Функция для копирования данных из поля
function copyToClipboard(field) {
    navigator.clipboard.writeText(field.value).then(() => {
        alert("Скопировано в буфер обмена!");
    }).catch((error) => {
        console.error("Ошибка копирования:", error);
    });
}

// Обработка выбора роли
roleSelection.addEventListener('change', (event) => {
    const selectedRole = event.target.value;
    if (selectedRole === 'host') {
        hostSection.classList.remove('hidden');
        clientSection.classList.add('hidden');
        createOfferButton.disabled = false;  // Разблокируем создание offer
        updateStatus("Выбрана роль: Хост. Готово к созданию Offer.");
    } else if (selectedRole === 'client') {
        clientSection.classList.remove('hidden');
        hostSection.classList.add('hidden');
        remoteOfferInput.disabled = false;  // Разблокируем поле для вставки offer
        updateStatus("Выбрана роль: Гость. Ожидание Offer от хоста.");
    }
});

// Обработчик для хоста
createOfferButton.addEventListener('click', async () => {
    const offer = await createHostConnection();
    document.getElementById('offer').value = JSON.stringify(offer);
    copyOfferButton.disabled = false;
    remoteAnswerInput.disabled = false;
    setAnswerButton.disabled = false;
    updateStatus("Offer создан. Ожидание Answer от гостя.");
});

// Обработчик для гостя
setOfferButton.addEventListener('click', async () => {
    const offer = JSON.parse(remoteOfferInput.value);
    const answer = await createGuestConnection(offer);
    document.getElementById('answer').value = JSON.stringify(answer);
    copyAnswerButton.disabled = false;
    // Разблокируем поля и кнопки для добавления ICE для гостя
    clientIceInput.disabled = false;
    addClientIceButton.disabled = false;
    updateStatus("Answer создан и отправлен хосту. Ожидание обмена ICE-кандидатами.");
});

// Установка Answer для хоста
setAnswerButton.addEventListener('click', async () => {
    const answer = JSON.parse(remoteAnswerInput.value);
    await setAnswerForHost(answer);
    updateStatus("Answer установлен на стороне хоста. Ожидание ICE-кандидатов.");
    
    // Разблокируем поля и кнопки для добавления ICE для хоста
    hostIceInput.disabled = false;
    addHostIceButton.disabled = false;
});

// Обработчики для обмена ICE-кандидатами
addHostIceButton.addEventListener('click', async () => {
    const candidates = hostIceInput.value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    updateStatus("ICE кандидаты от гостя добавлены.");
    // Начинаем игру для хоста после успешного обмена ICE-кандидатами
    startGame();
});

addClientIceButton.addEventListener('click', async () => {
    const candidates = clientIceInput.value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    updateStatus("ICE кандидаты от хоста добавлены.");
    // Начинаем игру для гостя после успешного обмена ICE-кандидатами
    startGame();
});

// Кнопки для копирования данных
copyOfferButton.addEventListener('click', () => copyToClipboard(document.getElementById('offer')));
copyAnswerButton.addEventListener('click', () => copyToClipboard(document.getElementById('answer')));
copyHostIceButton.addEventListener('click', () => copyToClipboard(document.getElementById('host-ice')));
copyClientIceButton.addEventListener('click', () => copyToClipboard(document.getElementById('client-ice')));

// Разблокировка кнопки "Установить Offer и создать Answer" при вводе offer для гостя
remoteOfferInput.addEventListener('input', () => {
    setOfferButton.disabled = remoteOfferInput.value.trim() === '';
});

// Разблокировка кнопки "Установить Answer" при вводе ответа для хоста
remoteAnswerInput.addEventListener('input', () => {
    setAnswerButton.disabled = remoteAnswerInput.value.trim() === '';
});

// Разблокировка кнопок ICE после ввода данных
hostIceInput.addEventListener('input', () => {
    addHostIceButton.disabled = hostIceInput.value.trim() === '';
});
clientIceInput.addEventListener('input', () => {
    addClientIceButton.disabled = clientIceInput.value.trim() === '';
});

// ===========================================================
// Логика игры: всё, что связано с игровым процессом
// ===========================================================

// Локальные и удаленные танки
let localTank = { x: 100, y: 100, width: 40, height: 40, color: 'green' };
let remoteTank = { x: 300, y: 300, width: 40, height: 40, color: 'red' };

// Конфигурация канваса для игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Обновление позиции танков
function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка локального танка
    ctx.fillStyle = localTank.color;
    ctx.fillRect(localTank.x, localTank.y, localTank.width, localTank.height);
    
    // Отрисовка удалённого танка
    ctx.fillStyle = remoteTank.color;
    ctx.fillRect(remoteTank.x, remoteTank.y, remoteTank.width, remoteTank.height);
}

// Обработка сообщений от удалённого игрока
setOnMessageReceived((data) => {
    const receivedData = JSON.parse(data);
    remoteTank.x = receivedData.x;
    remoteTank.y = receivedData.y;
    updateGame();
});

// Управление локальным танком
document.addEventListener('keydown', (event) => {
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
    sendData(localTank); // Отправка данных о локальном танке
    updateGame(); // Обновление экрана игры
});

// Начало игры после успешного подключения
function startGame() {
    gameCanvas.classList.remove('hidden');  // Показываем канвас для игры
    updateStatus("Игра началась!");
    updateGame();  // Первоначальная отрисовка
}
