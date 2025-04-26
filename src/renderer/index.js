let editor;

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const preview = document.getElementById('preview');
const themeSelector = document.getElementById('theme-selector');
const newFileBtn = document.getElementById('new-file-btn');
const openFileBtn = document.getElementById('open-file-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const projectList = document.getElementById('project-list');
const sidebar = document.querySelector('.sidebar');

let currentFilePath = null;
let themes = [];

// Initialiser l'éditeur avant d'essayer d'appliquer un thème
async function initEditor() {
  const textarea = document.getElementById('editor');
  if (!textarea) {
    console.error('Textarea #editor not found');
    return;
  }
  
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'markdown',
    lineNumbers: true,
    lineWrapping: true,
    theme: 'default',
    // Suppression de scrollbarStyle qui cause des problèmes
    viewportMargin: Infinity,
    readOnly: false,
    extraKeys: {
      'Ctrl-S': () => saveFileBtn.click(),
      'Cmd-S': () => saveFileBtn.click()
    }
  });

  editor.on('change', () => {
    const content = editor.getValue() || '';
    preview.innerHTML = marked.parse(content);
  });

  // Synchronisation du défilement
  editor.on('scroll', () => {
    const scrollInfo = editor.getScrollInfo();
    const scrollPercentage = scrollInfo.top / (scrollInfo.height - scrollInfo.clientHeight);
    if (!isNaN(scrollPercentage)) {
      preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
    }
  });

  preview.addEventListener('scroll', () => {
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    if (!isNaN(scrollPercentage)) {
      const scrollInfo = editor.getScrollInfo();
      editor.scrollTo(0, scrollPercentage * (scrollInfo.height - scrollInfo.clientHeight));
    }
  });

  editor.focus();
  
  // Charger les thèmes après l'initialisation de l'éditeur
  await loadThemes();
}

async function loadThemes() {
  try {
    themes = await window.electronAPI.getThemes();
    themeSelector.innerHTML = themes.themes.map(theme =>
      `<option value="${theme.id}">${theme.name}</option>`
    ).join('');
    
    // S'assurer que themes.themes existe et n'est pas vide
    if (themes.themes && themes.themes.length > 0) {
      themeSelector.value = themes.themes[0].id;
      applyTheme(themes.themes[0].id);
    }
  } catch (error) {
    console.error('Error loading themes:', error);
  }
}

function applyTheme(themeId) {
  // Vérifier que editor est défini et que themes.themes existe
  if (!editor || !themes.themes) return;
  
  const theme = themes.themes.find(t => t.id === themeId);
  if (!theme) return;

  // Appliquer la classe de thème au body
  document.body.className = `theme-${themeId}`;

  // Appliquer le thème à CodeMirror de façon sécurisée
  if (editor.setOption) {
    editor.setOption('theme', theme.editor.codemirrorTheme);
  }

  // Appliquer les styles CSS via variables
  document.documentElement.style.setProperty('--editor-bg', theme.editor.background);
  document.documentElement.style.setProperty('--editor-color', theme.editor.color);
  document.documentElement.style.setProperty('--editor-border', theme.editor.border);
  document.documentElement.style.setProperty('--preview-bg', theme.preview.background);
  document.documentElement.style.setProperty('--preview-color', theme.preview.color);
  document.documentElement.style.setProperty('--sidebar-bg', theme.sidebar.background);
  document.documentElement.style.setProperty('--sidebar-color', theme.sidebar.color);
  document.documentElement.style.setProperty('--toolbar-bg', theme.toolbar.background);
  document.documentElement.style.setProperty('--toolbar-color', theme.toolbar.color);
  document.documentElement.style.setProperty('--body-bg', theme.body.background);
  document.documentElement.style.setProperty('--button-bg', themeId === 'light' ? '#e0e0e0' : '#44475a');
  document.documentElement.style.setProperty('--button-hover', themeId === 'light' ? '#d0d0d0' : '#555770');
}

themeSelector.addEventListener('change', () => {
  applyTheme(themeSelector.value);
});

newFileBtn.addEventListener('click', () => {
  if (!editor) return;
  editor.setValue('');
  preview.innerHTML = '';
  currentFilePath = null;
});

openFileBtn.addEventListener('click', async () => {
  if (!editor) return;
  try {
    const result = await window.electronAPI.openFile();
    if (result) {
      editor.setValue(result.content);
      preview.innerHTML = marked.parse(result.content);
      currentFilePath = result.filePath;
    }
  } catch (error) {
    console.error('Error opening file:', error);
    alert('Erreur lors de l\'ouverture du fichier.');
  }
});

saveFileBtn.addEventListener('click', async () => {
  if (!editor) return;
  try {
    const content = editor.getValue();
    const filePath = await window.electronAPI.saveFile(content, currentFilePath);
    if (filePath) {
      currentFilePath = filePath;
      alert(`Fichier sauvegardé à : ${filePath}`);
    }
  } catch (error) {
    console.error('Error saving file:', error);
    alert('Erreur lors de la sauvegarde du fichier.');
  }
});

exportPdfBtn.addEventListener('click', async () => {
  if (!editor) return;
  try {
    const content = editor.getValue();
    const filePath = await window.electronAPI.exportPDF(content);
    if (filePath) {
      alert(`PDF exporté à : ${filePath}`);
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Erreur lors de l\'exportation du PDF.');
  }
});

newProjectBtn.addEventListener('click', async () => {
  try {
    const projectName = await window.electronAPI.promptProjectName();
    if (projectName) {
      await window.electronAPI.createProject(projectName);
      loadProjects();
    }
  } catch (error) {
    console.error('Error creating project:', error);
    alert('Erreur lors de la création du projet.');
  }
});

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

async function loadProjects() {
  try {
    const projects = await window.electronAPI.getProjects();
    projectList.innerHTML = '';
    for (const project of projects) {
      const projectItem = document.createElement('li');
      projectItem.dataset.path = project.path;
      projectItem.innerHTML = `
        <div class="project-header">
          <span>${project.name}</span>
          <button class="new-file-project-btn" data-project-path="${project.path}">+</button>
        </div>
        <ul class="file-list"></ul>
      `;
      projectList.appendChild(projectItem);

      // Gestion du clic sur le projet pour afficher les fichiers
      projectItem.querySelector('.project-header').addEventListener('click', async (e) => {
        e.stopPropagation();
        const projectPath = projectItem.dataset.path;
        if (!projectPath) {
          console.error('Project path is undefined');
          return;
        }
        try {
          const files = await window.electronAPI.getProjectFiles(projectPath);
          const fileList = projectItem.querySelector('.file-list');
          fileList.innerHTML = files.map(file =>
            `<li class="file" data-path="${file.path}">${file.name}</li>`
          ).join('');
          fileList.querySelectorAll('.file').forEach(fileItem => {
            fileItem.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!editor) return;
              try {
                const result = await window.electronAPI.openFile(fileItem.dataset.path);
                if (result) {
                  editor.setValue(result.content);
                  preview.innerHTML = marked.parse(result.content);
                  currentFilePath = result.filePath;
                }
              } catch (error) {
                console.error('Error opening file:', error);
                alert('Erreur lors de l\'ouverture du fichier.');
              }
            });
          });
        } catch (error) {
          console.error('Error loading project files:', error);
          alert('Erreur lors du chargement des fichiers du projet.');
        }
      });

      // Gestion du clic sur le bouton "Nouveau Fichier"
      projectItem.querySelector('.new-file-project-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const projectPath = e.target.dataset.projectPath;
          const fileName = await window.electronAPI.promptFileName();
          if (fileName) {
            const filePath = await window.electronAPI.createFile(projectPath, fileName);
            
            // Rafraîchir la liste des fichiers
            projectItem.querySelector('.project-header').click();
            alert(`Fichier créé : ${filePath}`);
          }
        } catch (error) {
          console.error('Error creating file:', error);
          alert('Erreur lors de la création du fichier.');
        }
      });
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    alert('Erreur lors du chargement des projets.');
  }
}

// Initialiser l'éditeur, puis charger les thèmes et projets
initEditor().then(() => {
  loadProjects();
  preview.innerHTML = marked.parse('');
});