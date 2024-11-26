// Ініцыялізуем падключэнне WebSocket пасля таго, як скрыпт socket.io загружаны
const socket = io('https://vilija.onrender.com', {
    auth: {
        token: localStorage.getItem('token'), // Перадача токена пры падключэнні
    },
});

let offset = 0;
let loadingHistory = false;

const messagesContainer = document.getElementById('chatMessages');

// Падключэнне да сервера
socket.on('connect', () => {
    console.log('Successfully connected to the server');
    loadHistory();  // Загружаем гісторыю пасля падключэння
});

// Функцыя для фарматавання часу (гадзіна і хвіліна)
function formatTime(dateString) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
    };
    const date = new Date(dateString); // Пераўтворыце timestamp у аб'ект Date
    return new Intl.DateTimeFormat('en-GB', options).format(date); // Вяртае гадзіну і хвіліну
}

// Абнаўленне спісу паведамленняў пры загрузцы гісторыі
function loadHistory() {
    if (loadingHistory) return;
    loadingHistory = true;

    socket.emit('load history', { offset }, (messages) => {
        if (messages.length === 0) {
            loadingHistory = false; // No more data
            return;
        }

        // Add messages to the bottom
        messages.reverse().forEach((message) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `
                <div class="chat-message-username" style="color: ${message.color || '#FFFFFF'}">${message.sender}</div>
                <div>${message.text.replace(/\n/g, '<br>')}</div>
                <div class="chat-message-time">${formatTime(message.timestamp)}</div>
            `;
            messagesContainer.appendChild(messageElement);
        });

        // Update offset for future requests
        offset += messages.length;

        // Update loading state
        loadingHistory = false;

        // Scroll to bottom after loading messages
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}


// Абслугоўваем падзею скролу
messagesContainer.addEventListener('scroll', () => {
    if (messagesContainer.scrollTop === 0) {
        loadHistory();
    }
});

// Абнаўленне спісу паведамленняў пры новых паведамленнях
socket.on('message', (message) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';

    const usernameElement = document.createElement('div');
    usernameElement.className = 'chat-message-username';
    usernameElement.textContent = message.sender;

    // Задаем колер для імя карыстальніка
    usernameElement.style.color = message.color;  // Адпраўляемы калер у кожным паведамленні

    const textElement = document.createElement('div');
    textElement.innerHTML = message.text.replace(/\n/g, '<br>');

    const timeElement = document.createElement('div');
    timeElement.className = 'chat-message-time';
    timeElement.textContent = formatTime(message.timestamp); // Фарматуем час для кожнага паведамлення

    messageElement.appendChild(usernameElement);
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement); // Дадаем час
    messagesContainer.appendChild(messageElement);

    // Пракрутка ўніз пасля дабаўлення паведамлення
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Функцыя для адпраўкі паведамлення
function sendMessage() {
    const input = document.getElementById('chatInput');

    if (input.value.trim() !== '') {
        const color = localStorage.getItem('color') || '#FFFFFF';

        // Адпраўляем паведамленне з \n (без замены на <br>)
        socket.emit('message', {
            text: input.value.trim(),
            senderColor: color
        });

        input.value = ''; // Ачышчэнне поля ўводу
    }
}

const chatInput = document.getElementById("chatInput");

chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { // Shift + Enter для новага радка
        event.preventDefault(); // Пазбегнуць пераносу радка
        sendMessage();
    }
});

// Абработчык для кнопкі тэмы
document.getElementById('theme').addEventListener('click', function () {
    // Змяняем клас тэмы ў body
    document.body.classList.toggle('light-theme');

    // Захоўваем стан тэмы ў LocalStorage
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
});

// Правяраем захаваную тэму пры загрузцы старонкі
document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
});

// Функцыя для выхаду
function logout() {
    // Выдаляем токен з localStorage
    localStorage.removeItem('token');
    // Перанакіроўваем на старонку лагіна
    window.location.href = 'index.html';
}

// Абработчык націску на кнопку "logout"
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

// Абработчык націску на кнопку "очысціць чат"
document.getElementById('cleenchat').addEventListener('click', function () {
    fetch('https://vilija.onrender.com/clearMessages', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Чат ачышчаны');
                location.reload();  // Перазагружаем старонку
            } else {
                console.log('Немагчыма ачысціць чат');
            }
        })
        .catch(error => {
            console.error('Памылка:', error);
        });
});

document.getElementById('info').addEventListener('click', function () {
    if (localStorage.getItem('token')) {
        window.location.href = '/article';
    }
});
