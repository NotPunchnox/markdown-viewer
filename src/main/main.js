const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { exportToPDF } = require('./pdfExporter');
const prompt = require('electron-prompt');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../renderer/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('save-file', async (event, content, filePath) => {
  if (!filePath) {
    const { filePath: newFilePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    filePath = newFilePath;
  }
  if (filePath) {
    await fs.writeFile(filePath, content);
    return filePath;
  }
  return null;
});

ipcMain.handle('open-file', async (event, filePath) => {
  if (!filePath) {
    const { filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      properties: ['openFile'],
    });
    filePath = filePaths && filePaths.length > 0 ? filePaths[0] : null;
  }
  if (filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return { filePath, content };
  }
  return null;
});

ipcMain.handle('export-pdf', async (event, content, filePath) => {
  if (!filePath) {
    const { filePath: newFilePath } = await dialog.showSaveDialog({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    filePath = newFilePath;
  }
  if (filePath) {
    await exportToPDF(content, filePath);
    return filePath;
  }
  return null;
});

ipcMain.handle('create-project', async (event, projectName) => {
  const projectDir = path.join(app.getPath('documents'), 'MarkdownProjects', projectName);
  await fs.ensureDir(projectDir);
  return projectDir;
});

ipcMain.handle('prompt-project-name', async () => {
  return await prompt({
    title: 'Nouveau Projet',
    label: 'Nom du projet :',
    value: '',
    inputAttrs: { type: 'text' },
    type: 'input',
    width: 400,
    height: 200,
  }, mainWindow);
});

ipcMain.handle('get-projects', async () => {
  const projectsDir = path.join(app.getPath('documents'), 'MarkdownProjects');
  await fs.ensureDir(projectsDir);
  const projects = await fs.readdir(projectsDir, { withFileTypes: true });
  return projects
    .filter(dirent => dirent.isDirectory())
    .map(dirent => ({
      name: dirent.name,
      path: path.join(projectsDir, dirent.name),
    }));
});

ipcMain.handle('get-project-files', async (event, projectPath) => {
  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('Invalid project path');
  }
  const files = await fs.readdir(projectPath, { withFileTypes: true });
  return files
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
    .map(dirent => ({
      name: dirent.name,
      path: path.join(projectPath, dirent.name),
    }));
});

ipcMain.handle('get-themes', async () => {
  const themesPath = path.join(__dirname, '../renderer/config/themes.json');
  return await fs.readJson(themesPath);
});

ipcMain.handle('save-theme', async (event, themes) => {
  const themesPath = path.join(__dirname, '../renderer/config/themes.json');
  await fs.writeJson(themesPath, themes, { spaces: 2 });
});