const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require("path");


let tray;
let win;
let onlineStatusWindow;

app.whenReady().then(() => {
    onlineStatusWindow = new BrowserWindow({ 
        width: 0, 
        height: 0, 
        show: false 
    });

    onlineStatusWindow.loadURL(path.join('file://', path.resolve(__dirname, 'index.html')));
});

function createWindow () {

    win = new BrowserWindow({
        icon: path.join(__dirname, "icon.ico"),
        backgroundColor: "#000",
        width: 650,
        height: 560,
        minWidth: 380,
        minHeight: 380,
        autoHideMenuBar: true,
        titleBarStyle: "hidden",
        frame: false,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js')
        },
        title: `ConsoleChat v${require(path.join(__dirname, "package.json")).version}`
    });

    win.loadFile(path.join(__dirname, 'index.html'));

    // win.webContents.toggleDevTools();

    tray = new Tray(path.join(__dirname, "icon.ico"));
    tray.setToolTip('ConsoleChat');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', type: 'normal', click: () => { app.quit(); } },
        // { label: "Not disturb", type: "checkbox", }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on("click", () => win.focus());

    // win.setOverlayIcon(path.join(__dirname, "notif.ico"), "ConsoleChat");

    win.on('closed', () => {
        tray.destroy(); // Всё равно остаётся в трее пока не проведёшь по ней мышью.
        win = null;
        app.quit();
    });

}

ipcMain.on('appClose', () => {
    tray.destroy();
    app.quit();
});
ipcMain.on('appWrap', () => {
    win.minimize();
});
ipcMain.on('appExpand', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize()
});
ipcMain.on('appDev', () => {
    win.webContents.toggleDevTools();
});

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        tray.destroy();
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});