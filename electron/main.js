const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase, getAllStudents, searchStudents, getStudentById, createStudent, updateStudent, deleteStudent, bulkCreateStudents, createTransferRequest, getTransferRequestsByStudentId, getGroups, createGroup, deleteGroup } = require('./db');

let mainWindow;
let isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'client', 'public', 'favicon.png'),
    title: 'نظام إدارة بيانات الطلاب',
    backgroundColor: '#f5f5f5'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'public', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Students
ipcMain.handle('students:getAll', async () => {
  return getAllStudents();
});

ipcMain.handle('students:search', async (event, query, type) => {
  return searchStudents(query, type);
});

ipcMain.handle('students:getById', async (event, id) => {
  return getStudentById(id);
});

ipcMain.handle('students:create', async (event, studentData) => {
  return createStudent(studentData);
});

ipcMain.handle('students:update', async (event, id, studentData) => {
  return updateStudent(id, studentData);
});

ipcMain.handle('students:delete', async (event, id) => {
  return deleteStudent(id);
});

ipcMain.handle('students:bulkCreate', async (event, studentsData, groupName) => {
  return bulkCreateStudents(studentsData, groupName);
});

// IPC Handlers for Groups
ipcMain.handle('groups:getAll', async () => {
  return getGroups();
});

ipcMain.handle('groups:create', async (event, groupData) => {
  return createGroup(groupData);
});

ipcMain.handle('groups:delete', async (event, id) => {
  return deleteGroup(id);
});

// IPC Handlers for Transfer Requests
ipcMain.handle('transferRequests:create', async (event, requestData) => {
  return createTransferRequest(requestData);
});

ipcMain.handle('transferRequests:getByStudentId', async (event, studentId) => {
  return getTransferRequestsByStudentId(studentId);
});

console.log('Electron app started successfully');
