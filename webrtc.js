export let peerConnection;
export let dataChannel;
export let isHost = false;
let onMessageReceived;
let isDataChannelOpen = false;  // Флаг для отслеживания состояния DataChannel

// Конфигурация STUN/TURN-серверов
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:numb.viagenie.ca', credential: 'webrtc', username: 'guest' }
    ]
};

// Функция для установки обработчика сообщений
export function setOnMessageReceived(callback) {
    onMessageReceived = callback;
}

// Инициализация WebRTC для хоста
export async function createHostConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    dataChannel = peerConnection.createDataChannel("game");

    // Устанавливаем флаг при открытии DataChannel
    dataChannel.onopen = () => {
        isDataChannelOpen = true;
        console.log("DataChannel открыт для хоста");
    };
    dataChannel.onmessage = (event) => onMessageReceived(event.data);

    // Генерация ICE-кандидатов
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            const iceCandidatesField = document.getElementById('host-ice');
            iceCandidatesField.value += JSON.stringify(event.candidate) + '\n';
            document.getElementById('copy-host-ice').disabled = false;  // Разблокируем кнопку копирования ICE-кандидатов
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
}

// Инициализация WebRTC для гостя
export async function createGuestConnection(offer) {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;

        // Устанавливаем флаг при открытии DataChannel
        dataChannel.onopen = () => {
            isDataChannelOpen = true;
            console.log("DataChannel открыт для гостя");
        };
        dataChannel.onmessage = (event) => onMessageReceived(event.data);
    };

    // Генерация ICE-кандидатов
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            const iceCandidatesField = document.getElementById('client-ice');
            iceCandidatesField.value += JSON.stringify(event.candidate) + '\n';
            document.getElementById('copy-client-ice').disabled = false;  // Разблокируем кнопку копирования ICE-кандидатов
        }
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
}

// Установка Answer для хоста
export async function setAnswerForHost(answer) {
    try {
        console.log("Начало установки Answer на стороне хоста...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Answer успешно установлен на стороне хоста.");
    } catch (error) {
        console.error("Ошибка при установке Answer на стороне хоста:", error);
    }
}

// Добавление ICE кандидатов
export async function addIceCandidate(candidateString) {
    try {
        const candidate = JSON.parse(candidateString);
        console.log("Попытка добавить ICE кандидата:", candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE кандидат успешно добавлен:", candidate);
    } catch (error) {
        console.error("Ошибка при добавлении ICE кандидата:", error);
    }
}

// Экспортируем функцию sendData
export function sendData(data) {
    if (isDataChannelOpen && dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(data));
    } else {
        console.warn("DataChannel не готов к отправке данных");
    }
}
