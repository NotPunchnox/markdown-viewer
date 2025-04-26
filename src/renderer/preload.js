const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, filePath) => ipcRenderer.invoke('save-file', content, filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  exportPDF: (content, filePath) => ipcRenderer.invoke('export-pdf', content, filePath),
  createProject: (projectName) => ipcRenderer.invoke('create-project', projectName),
  promptProjectName: () => ipcRenderer.invoke('prompt-project-name'),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProjectFiles: (projectPath) => {
    console.log('IPC Sending projectPath:', projectPath); // Débogage
    return ipcRenderer.invoke('get-project-files', projectPath);
  },
  getThemes: () => ipcRenderer.invoke('get-themes'),
  saveTheme: (themes) => ipcRenderer.invoke('save-theme', themes),
});