class Client {
    constructor(socket) {        
        this.socket = socket;
        this.token = localStorage.getItem("token");

        this._events = [];
    
        this.onlineCount = null;
        this.id = null;
        this.login = null;
        this.messages = null;

        this._eventBridgh = ["userConnected", "messageCreate", "userDisconnected", "userWriting", "userWritingStop"];
        for (let i of this._eventBridgh) this.socket.on(i, (...args) => this.emit(i, ...args));

    }

    emit(event, ...args) {
        for (const i of this._events) if (i[event]) setTimeout(i[event](...args));
    }

    on(event, fn) {
        this._events.push({[event]: fn});
    }

    onWithoutDublicate(event, fn) {
        if (this._events.includes(event)) return;
        this._events.push({[event]: fn});
    }

    reconnect() {
        if (!this.socket) throw new Error("Socket is not inited");
        if (!this.socket.disconnected) this.socket.disconnect();
        this.socket.connect();
    }

    connectChat() {
        return new Promise((res, rej) => {
            this.socket.once("ready", data => {
                if (!data.connected) return rej(new ErrorTokenIsInvalid());

                this.onlineCount = data.online;
                this.id = data.id;
                this.messages = data.messages;
                this.login = data.login

                res(true);
            });
            this.socket.emit("ready", this.token || false);
        });
    }

    async auth(login, password) {
        return new Promise((res, rej) => {
            if (login?.length < 2 || login?.length > 26 || password?.length < 10) return rej(new ErrorIncorrectFormat());
            this.socket.once("auth", data => {
                if (data.fail) return rej(new ErrorIncorrectLogin());
                localStorage.setItem("token", data.token);
                this.token = data.token;
                res(true);
            });
            this.socket.emit("auth", login, password);
        });
    }

    sendMessage(content) {
        this.socket.emit("messageCreate", content);
    }

    getUserInfo(id) {
        return new Promise((res, rej) => {
            this.socket.once("userInfo", (err, data) => {
                if (err) return rej();
                res(data);
            });
            this.socket.emit("userInfo", id);
        });
    }
}