const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, filePath) => ipcRenderer.invoke('save-file', content, filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  exportPDF: (content, filePath) => ipcRenderer.invoke('export-pdf', content, filePath),
  createProject: (projectName) => ipcRenderer.invoke('create-project', projectName),
  promptProjectName: () => ipcRenderer.invoke('prompt-project-name'),
  promptFileName: () => ipcRenderer.invoke('prompt-file-name'),
  createFile: (projectPath, fileName) => ipcRenderer.invoke('create-file', projectPath, fileName),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProjectFiles: (projectPath) => {
    console.log('IPC Sending projectPath:', projectPath); // Débogage
    return ipcRenderer.invoke('get-project-files', projectPath);
  },
  getThemes: () => ipcRenderer.invoke('get-themes'),
  saveTheme: (themes) => ipcRenderer.invoke('save-theme', themes),

  deleteProject: async (projectPath) => {
    return await ipcRenderer.invoke('delete-project', projectPath);
  },
  createFolder: async (parentPath, folderName) => {
    return await ipcRenderer.invoke('create-folder', parentPath, folderName);
  },
  promptFolderName: async () => {
    return await ipcRenderer.invoke('prompt-folder-name');
  },
  getDirectoryFiles: async (dirPath) => {
    return await ipcRenderer.invoke('get-directory-files', dirPath);
  },
  deleteFileOrFolder: async (path, isDirectory) => {
    return await ipcRenderer.invoke('delete-file-or-folder', path, isDirectory);
  }

});
