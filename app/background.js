const {app, BrowserWindow, ipcMain, Tray, Menu, session, dialog, shell, nativeTheme} = require('electron');
const {createServer} = require('./src/server');
const path = require('path');
const arg = require('arg');
const { exit, platform } = require('process');
const packageJson = require('./package.json');
const chalk = require('chalk');
const {Settings} = require('./src/settings');
const fs = require('fs');

let win;
let tray;
let settings;

let shouldExit = false;
let playing = false;

//Arguments
const args = arg({
    '--server': Boolean,
    '--host': String,
    '--port': Number,
    '--help': Boolean,
    '--settings': Boolean,
    '--reset-settings': Boolean,
    '--reset-downloads': Boolean,
    '--log': Boolean,

    '-S': '--server',
    '-H': '--host',
    '-h': '--help',
    '-p': '--port'
}, {argv: process.argv.slice(1)});

executeCli();

//Get path to asset
function assetPath(a) {
    return path.join(__dirname, 'assets', a);
}

//Execute actions by parameters
function executeCli() {
    if (args['--help']) {
        console.log(`
${chalk.bold.blue('Saturn')} ${chalk.bold(`v${packageJson.version}`)} Release

${chalk.bold('USAGE:')}
--help, -h         Prints this and exits
--server, -S       Starts in server mode
--host, -H         Override host (default: 127.0.0.1)
--port, -p         Override port (default: 10069)

${chalk.bold('TOOLS:')}
--settings         Prints current settings and exits
--log              Prints server log and exits
--reset-settings   Reset settings to default
--reset-downloads  Delete downloads cache and database
        `);
        exit(0);
    }
    //Print settings and exit
    if (args["--settings"]) {
        let settings = new Settings();
        settings.load();
        console.log(JSON.stringify(settings, null, 2));
        exit(0);
    }
    if (args["--reset-settings"]) {
        fs.unlinkSync(Settings.getPath());
        exit(0);
    }
    //Delete downloads db and temp
    if (args['--reset-downloads']) {
        fs.unlinkSync(Settings.getDownloadsDB());
        fs.rmdirSync(Settings.getTempDownloads(), {recursive: true});
        exit(0);
    }
    //Show log
    if (args['--log']) {
        let p = path.join(Settings.getDir(), "saturn-server.log");
        console.log(fs.readFileSync(p, {encoding: 'utf-8'}).toString());
        exit(0);
    }
}

async function startServer() {

    //Override settings
    let override = {};
    if (args["--host"])
        override['host'] = args["--host"];
    if (args["--port"])
        override['port'] = args["--port"];

    settings = await createServer(true, () => {
        //Server error
        shouldExit = true;
        if (win) win.close();

        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Server error',
            message: 'Server error occured, Saturn is probably already running!',
            buttons: ['Close']
        });
    }, override);
}

async function createWindow() {
    //Create window
    win = new BrowserWindow({
        width: settings.width,
        darkTheme: true,
        height: settings.height,
        minWidth: 620,
        minHeight: 600,
        resizable: true,
        autoHideMenuBar: true,
        frame: settings.nativeTopBar,
        icon: assetPath("icon.png"),
        title: 'Saturn',
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            devTools: true,
            contextIsolation: false
        }
    });

    win.loadURL(`http://localhost:${settings.port}`);

    //Minimize to tray
    win.on('minimize', (event) => {
        if (settings.minimizeToTray) {
            event.preventDefault();
            win.hide();
        }
    });

    //On close
    win.on('close', async (event) => {
        if (shouldExit) {
            win = null;
            tray = null;
            app.quit();
            return true;
        }

        //Normal exit
        if (!settings || !settings.arl || settings.arl == '' || settings.closeOnExit) {
            win.webContents.send('onExit');
            shouldExit = true;
        }
        event.preventDefault();
        win.hide();
        return false;
    });

    //Thumbnail Toolbars
    setThumbarButtons();
}

//Single instance
const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) {
            if (!win.visible) win.show();
        }
    });
}

//Create window
app.on('ready', async () => {
    //No mac
    if (platform == 'darwin')
        process.exit(-1);

    await startServer();
    //Server mode
    if (args['--server']) return;
    createWindow();

    //Create Tray
    if (settings.forceWhiteTrayIcon || nativeTheme.shouldUseDarkColors)
        tray = new Tray(assetPath("icon-taskbar-white.png"));
    else
        tray = new Tray(assetPath("icon-taskbar-black.png"));
    tray.on('double-click', () => restoreWindow());
    tray.on('click', () => restoreWindow());

    setTray();
});

//Restore or create new window
function restoreWindow() {
    if (win) {
        win.show();
        setThumbarButtons();
        return;
    }
    createWindow();
}

//Update tray context menu
function setTray() {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Restore', 
            type: 'normal',
            click: () => restoreWindow()
        },
        playing ?
        {
            label: 'Pause',
            type: 'normal',
            click: () => win.webContents.send('togglePlayback')
        }
        : {
            label: 'Play',
            type: 'normal',
            click: () => win.webContents.send('togglePlayback')
        },
        {
            label: 'Next',
            type: 'normal',
            click: () => win.webContents.send('skipNext')
        },
        {
            label: 'Previous',
            type: 'normal',
            click: () => win.webContents.send('skipPrev')
        },
        {
            label: 'Exit',
            type: 'normal',
            click: () => {
                shouldExit = true;
                if (!win) return app.quit();
                win.close();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
}

//Update Thumbnail Toolbars (Windows)
function setThumbarButtons() {
    win.setThumbarButtons([
        {
            tooltip: 'Skip Previous',
            icon: assetPath('skip-previous.png'),
            click: () => win.webContents.send('skipPrev')
        },
        //Play/Pause
        playing ?
        {
            tooltip: 'Pause',
            icon: assetPath('pause.png'),
            click: () => win.webContents.send('togglePlayback')
        } :
        {
            tooltip: 'Play',
            icon: assetPath('play.png'),
            click: () => win.webContents.send('togglePlayback')
        },
        //Skip next
        {
            tooltip: 'Skip Next',
            icon: assetPath('skip-next.png'),
            click: () => win.webContents.send('skipNext')
        },
    ]);
}


//[] button
ipcMain.on('maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
});

//_ button in ui
ipcMain.on('minimize', () => {
    win.minimize();
});

//X button in ui
ipcMain.on('close', () => {
    win.close();
});

ipcMain.on('openUrl', (event, args) => {
    shell.openExternal(args);
});

//Playing state change from UI
ipcMain.on('playing', (event, args) => {
    playing = args;
    setThumbarButtons();
    setTray();
});

//Update settings from ui
ipcMain.on('updateSettings', (event, args) => {
    Object.assign(settings, args);
});

//onExit callback
ipcMain.on('onExit', () => {
    shouldExit = true;
    win.close();
});

//Open downloads directory
ipcMain.on('openDownloadsDir', async () => {
    if ((await shell.openPath(settings.downloadsPath)) == "") return;
    shell.showItemInFolder(settings.downloadsPath);
});

//Download path picker
ipcMain.on('selectDownloadPath', async (event) => {
    let res = await dialog.showOpenDialog({
        title: 'Downloads folder',
        properties: ['openDirectory', 'promptToCreate'],
    });
    if (!res.canceled && res.filePaths.length > 0) {
        event.reply('selectDownloadPath', res.filePaths[0]);
    }
});

//Login using browser
ipcMain.on('browserLogin', async (event) => {
    //Initial clean
    session.defaultSession.clearStorageData();

    let lwin = new BrowserWindow({
        width: 800,
        height: 600,
        icon: assetPath('icon.png'),
        title: "Deezer Login",
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false
        }
    });
    lwin.loadURL('https://deezer.com/login');

    let arl = await new Promise((res) => {
        lwin.webContents.on('did-navigate', async () => {
            let arlCookie = await session.defaultSession.cookies.get({
                name: "arl"
            });
            if (arlCookie.length > 0) {
                res(arlCookie[0].value);
            }
        });
    });

    lwin.close();
    lwin = null;
    //Delete deezer junk
    session.defaultSession.clearStorageData();
    
    event.reply('browserLogin', arl);
});