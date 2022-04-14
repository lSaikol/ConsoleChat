document.getElementById("drag-box").textContent = `ConsoleChat v${globalThis.info.version()}`;

const interface = document.getElementById("interface");
var countOnlineUsers;

var socket;
var status = "none";
var PORT = 8080;
var HOST = "http://localhost:"+PORT;
var widthWindow = window.innerWidth;
var heightWindow = window.innerHeight;
var writing;


const alertOnlineStatus = () => {
    console.log(`statusNetwork: ${navigator.onLine ? 'online' : 'offline'}`);
    
};

window.addEventListener('online',  alertOnlineStatus);
window.addEventListener('offline',  alertOnlineStatus);

alertOnlineStatus();

// window.isActive = true;


let loader = new Loading({
    animationSpeed: 100,
    countSticks: 12,
    minCountSticks: 4,
    spaceSticks: 3
});

let client = new Client(io(HOST));



function startLoading() {
    loader.start();
}
function endLoading() {
    loader.end();
}


function interfaceInfobox(block = interface) {

    let info = document.createElement("div");

    info.id = "infoBox";

    block.appendChild(info);
}


function clearElements(id) {
    [...document.getElementById(id).childNodes].map(n => n.remove());
}


function createError(reason = "Неизвестная ошибка") {
    console.error(reason);

    loader.end(); // ?????? ... Пускай будет

    let info = document.getElementById("infoBox");
    info.className = "i-error";
    info.textContent = reason;
    info.onclick = () => {
        info.textContent = "";
        info.className = "";
    };

    setTimeout(() => {
        info.textContent = "";
        info.className = "";
    }, 15000);
}


function createInfo(text, timer = null) {
    let info = document.getElementById("infoBox");
    info.className = "i-info";
    info.textContent = text;
    info.onclick = () => {
        info.textContent = "";
        info.className = "";
    };

    if (timer) setTimeout(() => {
        info.textContent = "";
        info.className = "";
    }, timer);
}


function openPageLogin() {

    if (client.currentPage !== "login") clearElements("interface");
    client.currentPage = "login";

    const div = document.createElement("div");
    const login = document.createElement("input");
    const password = document.createElement("input");
    const space = document.createElement("p");
    const auth = document.createElement("button");

    div.id = "center-login";
    login.id = "login";
    login.size = "20";
    login.placeholder = "Логин";
    password.id = "password";
    password.size = "20";
    password.type = "password";
    password.placeholder = "Пароль";
    auth.id = "auth";
    auth.textContent = "Войти";

    auth.onclick = async () => {
        if (!password.value) return;
        startLoading();
        try {
            await client.auth(login.value, password.value);
            await client.connectChat();
            openPageChat();
        } catch (err) {
            if (err instanceof ErrorIncorrectLogin) createError("Данные не подтверждены");
            if (err instanceof ErrorIncorrectFormat) createError("Неправильный формат данных");
        }
        endLoading();
    };

    document.onkeydown = async (e) => {
        if (e.code === "Enter" && password.value) {
            startLoading();
            try {
                await client.auth(login.value, password.value);
                await client.connectChat();
                openPageChat();
            } catch (error) {
                if (err instanceof ErrorIncorrectLogin) createError("Данные не подтверждены");
                if (err instanceof ErrorIncorrectFormat) createError("Неправильный формат данных");
            }
            endLoading();
        }
    };

    interfaceInfobox(div);
    div.appendChild(login);
    div.appendChild(password);
    div.appendChild(space);
    div.appendChild(auth);
    
    interface.appendChild(div);

}

function createMessageNotification(content) {
    if (!content || !content.trim()) return;

    let message = document.createElement("div");
    message.id = "textmessage";
    let color = document.createElement("span");
    color.id = "colorTextNotification";
    color.textContent = content;
    message.appendChild(color);

    chat.appendChild(message);
}

function createMessage(content, user) {
    if (!content || !content.trim()) return;

    let message = document.createElement("div");
    message.id = "textmessage";
    let colorName = document.createElement("span");
    colorName.id = "colorName";
    colorName.textContent = `${user} : `;
    let colorContent = document.createElement("span");
    colorContent.id = "colorText";
    colorContent.textContent = content;
    message.appendChild(colorName);
    message.appendChild(colorContent);

    chat.appendChild(message);
}

async function openPageChat() {

    loader.start();
    
    if (client.currentPage !== "chat") clearElements("interface");
    client.currentPage = "chat";

    function sendMessage(content, isPrivate = false) {

        // Неприятная фигня от которой лучше избавиться. Она ещё со старой версии
        // if (!window.isActive && !p.isLoadChat && !p.isPrivate && !data.notDisturb) {
        //     remote.getCurrentWindow().flashFrame(true);
        //     var notif = new Notification("ConsoleChat", {
        //         body: text                   
        //     });
        //     notif.onclick = (e) => {
        //         remote.getCurrentWindow().focus();
        //     };
        // }
        if (!content || !content.trim()) return;

        if (isPrivate) createMessageNotification(content);
        else {
            console.log("sendMessage");
            client.sendMessage(content);
            createMessage(content, client.login)
        }

        if  (chat.selectionStart == chat.selectionEnd) {
            chat.scrollTop = chat.scrollHeight;
        }
    }

    function getMessageContent() {
        let content = document.getElementById("message").value;
        document.getElementById("message").value = "";
        return content;
    }


    const chat = document.createElement("div");
    const space1 = document.createElement("p");
    const messageInput = document.createElement("div");
    const message = document.createElement("input");
    const button = document.createElement("button");
    const space2 = document.createElement("p");
    const exit = document.createElement("button");
    const checkbox = document.createElement("div");
    const notDisturbCheckbox = document.createElement("input");
    const notDisturb = document.createElement("label");

    chat.id = "chat";
    chat.style.height = window.innerHeight - 190 < 190 ? chat.style.height = 190 : chat.style.height = window.innerHeight - 190;
    chat.style.width = window.innerWidth;
    space1.id = "space1";
    message.id = "message";
    message.style.width = window.innerWidth - 125 < 255 ? message.style.width = 255 : message.style.width = window.innerWidth - 125;
    message.placeholder = "Отправить сообщение в чат";
    message.oninput = () => {
        // Вещь пока оставлена на потом. Когда-то она работала, но криво.

        // client.emit("messageWriting", client.id);

        // if (writing) clearTimeout(writing);
        // writing = setTimeout(() => {
        //     client.emit("messageWritingStop", client.id);
        // }, 6000);
    };
    button.id = "send";
    button.textContent = "Отправить";
    button.onclick = () => {
        sendMessage(getMessageContent());
    };
    messageInput.id = "messageInput";
    messageInput.appendChild(message);
    messageInput.appendChild(button);
    space2.id = "space2";
    exit.id = "exit";
    exit.textContent = "Выход";
    exit.onclick = () => {
        // client.socket.emit("userDisconnect");    // Возможно хорошая мысль. Но и переподключение пойдёт.
        client.reconnect();
        localStorage.clear();
        openPageLogin();
    };
    checkbox.className = "checkbox";
    notDisturbCheckbox.type = "checkbox";
    notDisturbCheckbox.id = "notDisturb";
    if (localStorage.getItem("notDisturb")) notDisturbCheckbox.checked = true;
    notDisturbCheckbox.onchange = () => {
        if (notDisturbCheckbox.checked) localStorage.setItem("notDisturb", "true")
        else localStorage.removeItem("notDisturb");
    };
    notDisturb.setAttribute("for", "notDisturb");
    notDisturb.textContent = "Не беспокоить";
    checkbox.appendChild(notDisturbCheckbox);
    checkbox.appendChild(notDisturb);

    document.onkeydown = (e) => {
        if (e.code === "Enter") {
            sendMessage(getMessageContent());
        }
    };

    additionalPanel();
    interfaceInfobox();
    interface.appendChild(chat);
    interface.appendChild(space1);
    interface.appendChild(messageInput);
    interface.appendChild(space2);
    interface.appendChild(exit);
    interface.appendChild(checkbox);

    
    client.onWithoutDublicate("messageCreate", data => {
        createMessage(data.content, data.user);
    });
    client.onWithoutDublicate("userConnected", login => {
        document.getElementById("onlineUsers").textContent = `Online: ${++client.onlineCount}`;
        createMessageNotification(`Пользователь ${login} присоединился к чату`);
    });
    client.onWithoutDublicate("userDisconnected", login => {
        document.getElementById("onlineUsers").textContent = `Online: ${--client.onlineCount}`;
        createMessageNotification(`Пользователь ${login} отключился`);
    });


    for (const msg of client.messages) {
        let user = await client.getUserInfo(msg.user);
        createMessage(msg.content, user.login);
    }


    loader.end();
}

function additionalPanel(box = interface) {

    const div = document.createElement("div");
    const onlineUsersDiv = document.createElement("div");

    div.id = "additionalPanel";
    onlineUsersDiv.id = "onlineUsers";
    onlineUsersDiv.textContent = `Online: ${client.onlineCount}`;

    div.appendChild(onlineUsersDiv);
    box.appendChild(div);

}


(function() {
    var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
            requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    throttle("resize", "optimizedResize");
})();

window.addEventListener("optimizedResize", () => {

    const chat = document.getElementById("chat");
    const msg = document.getElementById("message");

    widthWindow = window.innerWidth;
    heightWindow = window.innerHeight;

    if (chat) {
        chat.style.height = window.innerHeight - 190 < 190 ? chat.style.height = 190 : chat.style.height = window.innerHeight - 190;
        chat.style.width = window.innerWidth;
    }
    if (msg) {
        msg.style.width = window.innerWidth - 125 < 255 ? msg.style.width = 255 : msg.style.width = window.innerWidth - 125;
    }
});


// Init
(async function() {
    if (client.token) {
        try {
            if ((await client.connectChat())) openPageChat();
        } catch (error) {
            openPageLogin();
            if (error instanceof ErrorTokenIsInvalid) createError("Ошибка токена. Повторите вход");
            createError();
            console.log(error);
        }
    }
    else openPageLogin();
})();