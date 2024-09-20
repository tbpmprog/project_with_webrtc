// interface.js — логика интерфейса

// Обновление статуса подключения
export function updateStatus(status) {
    const connectionStatus = document.getElementById('connection-status');
    connectionStatus.textContent = status;
}

// Функция для копирования данных
export function copyToClipboard(button, fieldId) {
    const field = document.getElementById(fieldId);
    navigator.clipboard.writeText(field.value).then(() => {
        // Удаляем предыдущее уведомление, если оно существует
        let existingNotification = button.nextElementSibling;
        if (existingNotification && existingNotification.classList.contains('notification')) {
            existingNotification.remove();
        }

        // Создаем уведомление
        const copyNotification = document.createElement('span');
        copyNotification.classList.add('notification');
        copyNotification.textContent = 'Скопировано!';

        // Добавляем уведомление рядом с кнопкой
        button.parentNode.insertBefore(copyNotification, button.nextSibling);

        // Удаляем уведомление через 1.5 секунды
        setTimeout(() => {
            copyNotification.remove();
        }, 1500);
    }).catch((error) => {
        console.error("Ошибка копирования:", error);
    });
}

// Автоматическое скрытие настроек
export function autoHideSettings() {
    const settingsSection = document.getElementById('settings-section');
    const settingsToggle = document.getElementById('settings-toggle');
    settingsSection.classList.add('hidden');
    settingsToggle.textContent = 'Показать настройки';
}

// Инициализация интерфейса
export function initializeInterface() {
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsSection = document.getElementById('settings-section');
    const createOfferButton = document.getElementById('create-offer');
    const remoteOfferInput = document.getElementById('remote-offer');

    settingsToggle.addEventListener('click', () => {
        if (settingsSection.classList.contains('hidden')) {
            settingsSection.classList.remove('hidden');
            settingsToggle.textContent = 'Скрыть настройки';
        } else {
            settingsSection.classList.add('hidden');
            settingsToggle.textContent = 'Показать настройки';
        }
    });

    // Добавляем логику для отображения блока подключения после выбора роли
    const roleSelection = document.getElementById('role-selection');
    const hostSection = document.getElementById('host-section');
    const clientSection = document.getElementById('client-section');

    roleSelection.addEventListener('change', (event) => {
        const selectedRole = event.target.value;
        if (selectedRole === 'host') {
            hostSection.classList.remove('hidden');
            clientSection.classList.add('hidden');
            createOfferButton.disabled = false;  // Разблокируем кнопку для хоста
        } else if (selectedRole === 'client') {
            clientSection.classList.remove('hidden');
            hostSection.classList.add('hidden');
            remoteOfferInput.disabled = false;  // Разблокируем поле для гостя
        }
    });
}
