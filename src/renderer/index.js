marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const themeSelector = document.getElementById('theme-selector');
const newFileBtn = document.getElementById('new-file-btn');
const openFileBtn = document.getElementById('open-file-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const projectList = document.getElementById('project-list');

let currentFilePath = null;
let themes = [];

// Charger les thèmes
async function loadThemes() {
  themes = await window.electronAPI.getThemes();
  themeSelector.innerHTML = themes.themes.map(theme => 
    `<option value="${theme.id}">${theme.name}</option>`
  ).join('');
  applyTheme(themes.themes[0].id);
}

// Appliquer un thème
function applyTheme(themeId) {
  const theme = themes.themes.find(t => t.id === themeId);
  if (!theme) return;

  // Appliquer les styles à l'éditeur
  editor.style.background = theme.editor.background;
  editor.style.color = theme.editor.color;
  editor.style.border = `1px solid ${theme.editor.border}`;

  // Appliquer les styles à la prévisualisation
  preview.style.background = theme.preview.background;
  preview.style.color = theme.preview.color;

  // Mettre à jour la classe du body pour d'autres éléments
  document.body.className = `theme-${themeId}`;
}

// Mettre à jour la prévisualisation en temps réel
editor.addEventListener('input', () => {
  preview.innerHTML = marked.parse(editor.value);
});

// Changer de thème
themeSelector.addEventListener('change', () => {
  applyTheme(themeSelector.value);
});

// Nouveau fichier
newFileBtn.addEventListener('click', () => {
  editor.value = '';
  preview.innerHTML = '';
  currentFilePath = null;
});

// Ouvrir un fichier
openFileBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile();
  if (result) {
    editor.value = result.content;
    preview.innerHTML = marked.parse(result.content);
    currentFilePath = result.filePath;
  }
});

// Sauvegarder le fichier
saveFileBtn.addEventListener('click', async () => {
  const content = editor.value;
  const filePath = await window.electronAPI.saveFile(content, currentFilePath);
  if (filePath) {
    currentFilePath = filePath;
    alert(`Fichier sauvegardé à : ${filePath}`);
  }
});

// Exporter en PDF
exportPdfBtn.addEventListener('click', async () => {
  const content = editor.value;
  const filePath = await window.electronAPI.exportPDF(content);
  if (filePath) {
    alert(`PDF exporté à : ${filePath}`);
  }
});

// Gestion des projets
newProjectBtn.addEventListener('click', async () => {
  const projectName = window.prompt('Nom du projet :'); // Utilisation de window.prompt
  if (projectName) {
    await window.electronAPI.createProject(projectName);
    loadProjects();
  }
});

async function loadProjects() {
  const projects = await window.electronAPI.getProjects();
  projectList.innerHTML = '';
  for (const project of projects) {
    const projectItem = document.createElement('li');
    projectItem.textContent = project.name;
    projectItem.addEventListener('click', async (e) => {
      e.stopPropagation();
      const files = await window.electronAPI.getProjectFiles(project.path);
      projectItem.innerHTML = `${project.name}<ul>${files.map(file => 
        `<li class="file" data-path="${file.path}">${file.name}</li>`
      ).join('')}</ul>`;
      projectItem.querySelectorAll('.file').forEach(fileItem => {
        fileItem.addEventListener('click', async (e) => {
          e.stopPropagation();
          const result = await window.electronAPI.openFile(fileItem.dataset.path);
          if (result) {
            editor.value = result.content;
            preview.innerHTML = marked.parse(result.content);
            currentFilePath = result.filePath;
          }
        });
      });
    });
    projectList.appendChild(projectItem);
  }
}

// Initialisation
loadThemes();
loadProjects();
preview.innerHTML = marked.parse(editor.value);