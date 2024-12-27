import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from 'electron';
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import confins from './config/config.ts';
import { ipc_register } from './ipc/register.ts';
import process from 'node:process';
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let mainWindow: BrowserWindow | undefined;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
  // win.loadURL('http://www.anchel.cn/tmp/mas.html?str=' + encodeURIComponent(JSON.stringify({resourcePath: process.resourcesPath, dname: __dirname}, null, 2)))

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 当窗口尝试关闭时，隐藏而不是销毁
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // 当窗口被关闭后，释放引用
  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    mainWindow = undefined;
  } else {
    if (mainWindow) {
      mainWindow.hide();
    }
  }
});

app.on('ready', () => {
  console.log('app.on ready');
});

// app.enableSandbox();

app.whenReady().then(() => {
  confins.init();
  nativeTheme.themeSource = confins.config.theme;

  createMenu();
  createMainWindow();

  ipc_register(ipcMain, mainWindow);

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow) {
      mainWindow.show();
    } else {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close'); // 允许窗口关闭
    mainWindow.close();
  }
});

// 创建菜单
function createMenu() {
  const template: Array<MenuItemConstructorOptions> = [
    {
      label: app.name,
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Go Home',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('route-page', '/');
            }
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Show Main Window',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            if (!mainWindow) {
              createMainWindow();
            } else {
              mainWindow.show();
            }
          },
        },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
