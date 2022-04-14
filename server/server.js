const { Sequelize, Model, DataTypes } = require('sequelize');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const cache = {};

const GSALT = "$2b$31$bcPbQoUjZMSWGwYLUD25Be";
const SIGNTOKEN = "SuPeR_SeCrE1_T0KeN";
const URIBD = "sqlite://./database.db";
const PORT = 8080;

const sequelize = new Sequelize(URIBD, {
    dialect: "sqlite",
    logging: false
});
require("colors");






class Users extends Model {

}

Users.init({    
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    login: {
        type: DataTypes.STRING,
        validate:{
            len: [2, 26]
        },
        allowNull:false
    },
    password: {
        type: DataTypes.STRING,
        validate:{
            min: 10
        },
        allowNull:false
    }
}, {
    sequelize
});

class Messages extends Model {

}

Messages.init({
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    content: {
        type: DataTypes.STRING,
        validate: {
            max: 2048
        },
        allowNull:false
    },
    user: {
        type: DataTypes.BIGINT
    }
}, {
    sequelize
});



if (!cache.usersWriting) cache.usersWriting = [];

const   server = {
            online: 0
        };

async function loader() {
    
    console.log("[#]".green + " Запуск сервера");

    try {
        console.log("[#]".green + " Загрузка базы данных");
        await sequelize.authenticate();
        await Users.sync({alter:true});
        await Messages.sync({alter:true});
    } catch (err) {
        console.log("[-]".red + " Не удалось подключиться к базе данных");
        console.log(err);
        process.exit();
    }
    
    console.log("[+] ".green + `База данных подключена`);



    io = require("socket.io")(PORT);

    io.on('connection', function (socket) {

        socket.on("auth", async (login, password) => {
    
            let [user, created] = await Users.findOrCreate({
                where: { login },
                defaults: { password: await hashEncrypt(password) }
            });

            if (!created) {
                if (!(await hashCompare(password, user.password))) return socket.emit("auth", {fail:true});
            } else {
                console.log(`----------------------`);
                console.log(`[+]`.green + `Создан новый аккаунт`);
                console.log(`User(${user.id}): ${user.login}`);
            }
    
            socket.emit("auth", {
                token: jwt.sign({id:user.id}, SIGNTOKEN),
                fail: false
            });
    
        });
    
        socket.on("createAccount", async (login, password) => {
            try {

                let [user, created] = await Users.findOrCreate({
                    where: { login },
                    defaults: { password: await hashEncrypt(password) }
                });

                if (created) {
                    console.log(`----------------------`);
                    console.log(`[+]`.green + `Создан новый аккаунт`);
                    console.log(`User(${user.id}): ${user.login}`);
                }
    
                socket.emit("createAccount", {
                    created
                });

            } catch (error) {

                socket.emit("createAccount", {
                    created: false
                });
                return console.log(err);

            }
    
        });

        function getMessages() {
            return Messages.findAll({ limit: 100 });
        }
    
        socket.on("ready", async (token) => {
    
            let verifyUser = await new Promise((res, rej) => {
                jwt.verify(token, SIGNTOKEN, (err, payload) => {
                    if (err) res(null)
                    else res(payload);
                });
            });
            if (!verifyUser) return socket.emit("ready", {
                connected: false
            });

            server.online++;
            let user = await Users.findByPk(verifyUser.id);

            socket.broadcast.emit('userConnected', user.login); 
            console.log(`[+] `.green + `Пользователь ${user.login} присоединился к чату!\n` + `[$] `.yellow + `Онлайн: ${server.online}`); 
        
            socket.on("messageCreate", async content => {
                try {

                    let message = await Messages.create({
                        content, 
                        user: user.id
                    });
                    console.log(`----------------------`);
                    console.log('User: ' + user.login + ' | Message: ' + message.content);
                    console.log(`[#] `.cyan + '====> Отправка сообщения всем клиентам');
                    socket.broadcast.emit('messageCreate', {
                        message,
                        user: user.login,
                        sended: true
                    });
                } catch (error) {
                    console.log(error);
                    socket.emit("messageCreate", { sended: false });
                }
            });

            socket.on("userWriting", userID => {
                socket.broadcast.emit("userWriting", userID);
            });

            socket.on("userWritingStop", userID => {
                socket.broadcast.emit("userWritingStop", userID);
            });
        
            socket.on("disconnect", () => {
                server.online--;
                io.sockets.emit("userDisconnected", user.login);
                // socket.removeAllListeners(); ???
                console.log(`[-] `.red + `Пользователь ${user.login} отключился!`);
            });
            
            socket.on("userDisconnected", () => {
                
            });

            socket.on("userInfo", async id => {
                try {
                    let user = await Users.findByPk(id);
                    if (!user) throw new Error("User not found");
                    socket.emit("userInfo", false, {
                        login: user.login,
                        created: user.createdAt
                    });
                } catch (error) {
                    socket.emit("userInfo", true);
                }
                
            });
    
            socket.emit("ready", {
                online: server.online,
                messages: await getMessages(),
                connected: true,
                id: user.id,
                login: user.login
            });
        });
        
    });
    
    console.log("[!] ".green + "Сервер запущен");
}

loader();


async function hashEncrypt(password) {
    return await bcrypt.hash(password, (await bcrypt.genSalt(10))+GSALT);
}
async function hashCompare(password, hash) {
    return await bcrypt.compare(password, hash)
}