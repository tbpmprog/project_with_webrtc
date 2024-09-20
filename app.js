export let peerConnection;
export let dataChannel;

// Конфигурация STUN-сервера
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'webrtc',
            username: 'guest'
        },
        {
            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        }
    ]
};

// Элементы страницы
const createOfferButton = document.getElementById('create-offer');
const setOfferButton = document.getElementById('set-offer');
const setAnswerButton = document.getElementById('set-answer');
const addHostIceButton = document.getElementById('add-host-ice');
const addClientIceButton = document.getElementById('add-client-ice');
const roleRadios = document.getElementsByName('role');
const hostSection = document.getElementById('host-section');
const clientSection = document.getElementById('client-section');
const remoteOfferInput = document.getElementById('remote-offer');
const remoteAnswerInput = document.getElementById('remote-answer');
const remoteHostIceInput = document.getElementById('remote-host-ice');
const remoteClientIceInput = document.getElementById('remote-client-ice');
const copyHostIceButton = document.getElementById('copy-host-ice');
const copyClientIceButton = document.getElementById('copy-client-ice');
const copyOfferButton = document.getElementById('copy-offer');
const copyAnswerButton = document.getElementById('copy-answer');
const connectionStatus = document.getElementById('connection-status');

// Функция для обновления статуса подключения
function updateStatus(status) {
    connectionStatus.textContent = status;
    console.log("Статус подключения: ", status);
}

// Функция для переключения видимости секций на основе выбранной роли
function handleRoleSelection() {
    roleRadios.forEach(radio => {
        if (radio.checked) {
            const role = radio.value;
            console.log(`Выбрана роль: ${role}`);
            
            // Скрываем или показываем секции
            if (role === 'host') {
                hostSection.classList.remove('hidden');
                clientSection.classList.add('hidden');
                createOfferButton.disabled = false;  // Разблокируем создание offer
                updateStatus("Роль: Хост. Готово к созданию Offer.");
            } else if (role === 'client') {
                clientSection.classList.remove('hidden');
                hostSection.classList.add('hidden');
                remoteOfferInput.disabled = false;  // Разблокируем поле для вставки offer
                updateStatus("Роль: Гость. Ожидание Offer от хоста.");
            }
        }
    });
}

// Привязка события выбора роли
roleRadios.forEach(radio => {
    radio.addEventListener('change', handleRoleSelection);
});

// Обработка кнопки создания Offer для Хоста
createOfferButton.addEventListener('click', async () => {
    const offer = await createHostConnection();
    document.getElementById('offer').value = JSON.stringify(offer);
    copyOfferButton.disabled = false;  // Разблокируем кнопку копирования offer
    remoteAnswerInput.disabled = false;  // Разблокируем поле для вставки answer
    setAnswerButton.disabled = false;  // Разблокируем кнопку для установки answer
    updateStatus("Offer создан. Ожидание Answer от гостя.");
});

// Обработка кнопки копирования Offer
copyOfferButton.addEventListener('click', () => {
    copyToClipboard(document.getElementById('offer').value);
});

// Обработка кнопки копирования Answer
copyAnswerButton.addEventListener('click', () => {
    copyToClipboard(document.getElementById('answer').value);
});

// Обработка кнопки копирования ICE-кандидатов хоста
copyHostIceButton.addEventListener('click', () => {
    copyToClipboard(document.getElementById('host-ice').value);
});

// Обработка кнопки копирования ICE-кандидатов гостя
copyClientIceButton.addEventListener('click', () => {
    copyToClipboard(document.getElementById('client-ice').value);
});

// Разблокировка кнопки "Установить Offer и создать Answer" при вводе offer для гостя
remoteOfferInput.addEventListener('input', () => {
    setOfferButton.disabled = remoteOfferInput.value.trim() === '';
});

// Обработка кнопки установки Offer для Гостя
setOfferButton.addEventListener('click', async () => {
    const offer = JSON.parse(remoteOfferInput.value);
    const answer = await createGuestConnection(offer);
    document.getElementById('answer').value = JSON.stringify(answer);
    copyAnswerButton.disabled = false;  // Разблокируем копирование answer
    remoteClientIceInput.disabled = false;  // Разблокируем поле для вставки ICE кандидатов
    addClientIceButton.disabled = false;  // Разблокируем кнопку добавления ICE кандидатов
    updateStatus("Answer сгенерирован. Отправьте его хосту.");
});

// Обработка кнопки установки Answer для Хоста
setAnswerButton.addEventListener('click', async () => {
    const answer = JSON.parse(remoteAnswerInput.value);
    await setAnswerForHost(answer);
    remoteHostIceInput.disabled = false;  // Разблокируем поле для вставки ICE кандидатов от гостя
    addHostIceButton.disabled = false;  // Разблокируем кнопку добавления ICE кандидатов
    updateStatus("Answer получен. Ожидание обмена ICE-кандидатами.");
});

// Добавление ICE кандидатов
addHostIceButton.addEventListener('click', async () => {
    const candidates = remoteHostIceInput.value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    alert("ICE кандидаты от гостя добавлены");
    updateStatus("ICE кандидаты от гостя добавлены.");
});

addClientIceButton.addEventListener('click', async () => {
    const candidates = remoteClientIceInput.value.trim().split('\n');
    for (let candidate of candidates) {
        if (candidate) {
            await addIceCandidate(candidate);
        }
    }
    alert("ICE кандидаты от хоста добавлены");
    updateStatus("ICE кандидаты от хоста добавлены.");
});

// Создание WebRTC соединения для хоста
export async function createHostConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    dataChannel = peerConnection.createDataChannel("game");
    dataChannel.onopen = () => {
        updateStatus("DataChannel открыт. Можно обмениваться данными.");
    };
    dataChannel.onmessage = (event) => {
        console.log("Сообщение получено:", event.data);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            document.getElementById('host-ice').value += JSON.stringify(event.candidate) + '\n';
            copyHostIceButton.disabled = false;  // Разблокируем кнопку копирования ICE-кандидатов после генерации
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        if (state === "connected") {
            updateStatus("Соединение установлено.");
        } else if (state === "disconnected" || state === "failed") {
            updateStatus("Соединение разорвано или не удалось.");
        } else {
            updateStatus(`Состояние соединения: ${state}`);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
}

// Создание WebRTC соединения для гостя
export async function createGuestConnection(offer) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onopen = () => {
            updateStatus("DataChannel открыт. Можно обмениваться данными.");
        };
        dataChannel.onmessage = (event) => {
            console.log("Сообщение получено:", event.data);
        };
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            document.getElementById('client-ice').value += JSON.stringify(event.candidate) + '\n';
            copyClientIceButton.disabled = false;  // Разблокируем кнопку копирования ICE-кандидатов после генерации
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        if (state === "connected") {
            updateStatus("Соединение установлено.");
        } else if (state === "disconnected" || state === "failed") {
            updateStatus("Соединение разорвано или не удалось.");
        } else {
            updateStatus(`Состояние соединения: ${state}`);
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
}

// Установка Answer для Хоста
export async function setAnswerForHost(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Функция копирования в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Скопировано в буфер обмена!");
    });
}

// Добавление ICE кандидатов
export async function addIceCandidate(candidateString) {
    try {
        const candidate = JSON.parse(candidateString);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE кандидат добавлен:", candidate);
    } catch (error) {
        console.error("Ошибка при добавлении ICE кандидата:", error);
    }
}
