// app.js — точка входа

import { createHostConnection, createGuestConnection, sendData, setAnswerForHost, addIceCandidate, setOnMessageReceived } from './webrtc.js';
import { updateStatus, copyToClipboard, autoHideSettings, initializeInterface } from './interface.js';
import { initializeGame, startGame, updateGame, sendInitialPosition, handleKeyPress } from './game.js';

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

createOfferButton.addEventListener('click', async () => {
    const offer = await createHostConnection();
    document.getElementById('offer').value = JSON.stringify(offer);
    copyOfferButton.disabled = false;
    updateStatus("Offer создан. Ожидание Answer от гостя.");
    setAnswerButton.disabled = false;
    document.getElementById('remote-answer').disabled = false;
});

setOfferButton.addEventListener('click', async () => {
    const offer = JSON.parse(document.getElementById('remote-offer').value);
    const answer = await createGuestConnection(offer);
    document.getElementById('answer').value = JSON.stringify(answer);
    copyAnswerButton.disabled = false;
    updateStatus("Answer создан и отправлен хосту.");
    addClientIceButton.disabled = false;
    document.getElementById('remote-client-ice').disabled = false;
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

// Запуск игры после получения начальных позиций
setOnMessageReceived((data) => {
    const receivedData = JSON.parse(data);
    initializeGame(receivedData);
    startGame();
});

// Слушаем нажатия клавиш для управления танком
document.addEventListener('keydown', handleKeyPress);

// Разблокировка кнопки создания Answer у гостя после ввода Offer
document.getElementById('remote-offer').addEventListener('input', () => {
    setOfferButton.disabled = document.getElementById('remote-offer').value.trim() === '';
});
