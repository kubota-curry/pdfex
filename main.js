const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Recommended for security
      enableRemoteModule: false // Recommended for security
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools - useful for development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Example of handling an IPC message from renderer to save a file
ipcMain.handle('save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(options);
});

ipcMain.handle('show-error-message', async (event, title, content) => {
  dialog.showErrorBox(title, content);
});
