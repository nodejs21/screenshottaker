const { app, BrowserWindow, ipcMain } = require('electron')
const { download } = require('electron-dl');
var path = require('path');
var url = require('url');
// const screen = electron.screen;
const fs = require('fs');
const os = require('os');

// const { setup: setupPushReceiver } = require('electron-push-receiver');

let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800, 
    height: 500,
    backgroundColor: '#ffffff'
    // icon: `file://${__dirname}/dist/assets/logo.png`
  })
  
  
  win.loadURL(`file://${__dirname}/dist/electronapp/index.html`)
  // wind.loadURL(url.format({
  //   pathname: path.join(__dirname + 'dist/index.html'),
  //   protocol: 'file',
  //   slashes: true
  // }))
  
  //// uncomment below to open the DevTools.
  // win.webContents.openDevTools()
  
  // DownloadManager.register();
  ipcMain.on('downloadImage', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), args.url)
    .then(dl => {
      // console.log(dl);
    })
    .catch(err => {
      console.log(err);
    });
  })  
  // Initialize electron-push-receiver component. Should be called before 'did-finish-load'
  // setupPushReceiver(win.webContents);
  
  win.on('close', async function () {
    await win.webContents.send('winClose');
  })
  
  // // Event when the window is closed.
  // win.on('closed', function () {
  //   win = null
  // })
}

// Create window on electron intialization
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS specific close process
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // macOS specific close process
  if (win === null) {
    createWindow()
  }
})


