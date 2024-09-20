// app.js — точка входа

import { createHostConnection, createGuestConnection, sendData, setAnswerForHost, addIceCandidate, setOnMessageReceived, setOnDataChannelOpen } from './webrtc.js';
import { updateStatus, copyToClipboard, autoHideSettings, initializeInterface } from './interface.js';
import { initializeGame, startGame, sendInitialPosition, handleKeyPress, receivedInitialPosition, sentInitialPosition, updateGame } from './game.js';  // Импортируем updateGame

// Элементы управления
const createOfferButton = document.getElementById('create-offer');
const setOfferButton = document.getElementById('set-offer');
const setAnswerButton = document.getElementById('set-answer');
const addHostIceButton = document.getElementById('add-host-ice');
const addClientIceButton = document.getElementById('add-client-ice');

// Кнопки копирования
const copyOfferButton = document.getElementById('copy-offer');
const copyAnswerButton = document.getElementById('copy-answer');
const copyHostIceButton = document.getElementById('copy-host-ice');
const copyClientIceButton = document.getElementById('copy-client-ice');

// Инициализация интерфейса
initializeInterface();

// Устанавливаем обработчик получения сообщений через DataChannel
setOnMessageReceived((data) => {
    console.log("Получены данные через DataChannel:", data);

    if (data && data !== "undefined") {
        try {
            const receivedData = JSON.parse(data);

            // Обновляем данные о танке только для удаленного игрока
            remoteTank.x = receivedData.x;
            remoteTank.y = receivedData.y;
            remoteTank.width = receivedData.width;
            remoteTank.height = receivedData.height;
            remoteTank.color = receivedData.color;

            updateGame();  // Обновляем отображение игры после получения данных
        } catch (error) {
            console.error("Ошибка при разборе данных:", error);
        }
    } else {
        console.warn("Получены некорректные или пустые данные через DataChannel.");
    }
});

// Устанавливаем обработчик открытия DataChannel
setOnDataChannelOpen(() => {
    console.log("DataChannel открыт, отправляем начальную позицию.");
    sendInitialPosition();  // Отправляем начальную позицию
    // Не вызываем checkIfReadyToStart здесь, ждем добавления ICE-кандидатов
});

createOfferButton.addEventListener('click', async () => {
    const offer = await createHostConnection();
    document.getElementById('offer').value = JSON.stringify(offer);
    copyOfferButton.disabled = false;
    updateStatus("Offer создан. Ожидание Answer от гостя.");
    setAnswerButton.disabled = false;
    document.getElementById('remote-answer').disabled = false;

    // Инициализация игры для хоста
    initializeGame();  // Явно вызываем инициализацию для хоста
});

setOfferButton.addEventListener('click', async () => {
    const offer = JSON.parse(document.getElementById('remote-offer').value);
    const answer = await createGuestConnection(offer);
    document.getElementById('answer').value = JSON.stringify(answer);
    copyAnswerButton.disabled = false;
    updateStatus("Answer создан и отправлен хосту.");
    addClientIceButton.disabled = false;
    document.getElementById('remote-client-ice').disabled = false;

    // Инициализация игры для гостя
    initializeGame();  // Явно вызываем инициализацию для гостя
});

setAnswerButton.addEventListener('click', async () => {
    const answer = JSON.parse(document.getElementById('remote-answer').value);
    await setAnswerForHost(answer);
    updateStatus("Answer установлен на стороне хоста.");
    addHostIceButton.disabled = false;
    document.getElementById('remote-host-ice').disabled = false;
    copyHostIceButton.disabled = false;
});

// Логика добавления ICE-кандидатов для хоста
addHostIceButton.addEventListener('click', async () => {
    const candidates = document.getElementById('remote-host-ice').value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    updateStatus("ICE кандидаты от гостя добавлены.");

    // Скрываем блок настроек
    autoHideSettings();  // Скрываем блок настроек после добавления ICE
    checkIfReadyToStart();  // Проверяем готовность к началу игры
});

// Логика добавления ICE-кандидатов для гостя
addClientIceButton.addEventListener('click', async () => {
    const candidates = document.getElementById('remote-client-ice').value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    updateStatus("ICE кандидаты от хоста добавлены.");

    // Скрываем блок настроек только после добавления ICE
    autoHideSettings();  // Скрываем блок настроек после успешного добавления ICE
    checkIfReadyToStart();  // Проверяем готовность к началу игры
});

// Логика копирования с уведомлением
copyOfferButton.addEventListener('click', () => {
    copyToClipboard(copyOfferButton, 'offer');
});

copyAnswerButton.addEventListener('click', () => {
    copyToClipboard(copyAnswerButton, 'answer');
});

copyHostIceButton.addEventListener('click', () => {
    copyToClipboard(copyHostIceButton, 'host-ice');
});

copyClientIceButton.addEventListener('click', () => {
    copyToClipboard(copyClientIceButton, 'client-ice');
});

// Проверяем готовность к началу игры и скрываем блок настроек
function checkIfReadyToStart() {
    console.log("Проверка готовности к началу игры:");
    console.log("receivedInitialPosition:", receivedInitialPosition);
    console.log("sentInitialPosition:", sentInitialPosition);
    
    if (receivedInitialPosition && sentInitialPosition) {
        console.log("Готово к началу игры. Скрываем настройки и запускаем игру.");
        startGame();  // Запускаем игру
    } else {
        console.log("Еще не готово к началу игры.");
    }
}

// Слушаем нажатия клавиш для управления танком
document.addEventListener('keydown', handleKeyPress);

// Разблокировка кнопки создания Answer у гостя после ввода Offer
document.getElementById('remote-offer').addEventListener('input', () => {
    setOfferButton.disabled = document.getElementById('remote-offer').value.trim() === '';
});
