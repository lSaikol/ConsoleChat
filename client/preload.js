const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("titleBar", {
    close: () => ipcRenderer.send("appClose"),
    wrap: () => ipcRenderer.send("appWrap"),
    expand: () => ipcRenderer.send("appExpand"),
    dev: () => ipcRenderer.send("appDev")
});

contextBridge.exposeInMainWorld("info", {
    version: () => require(require("path").join(__dirname, "package.json")).version
});