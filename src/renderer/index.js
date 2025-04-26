let editor;

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
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

async function loadThemes() {
  themes = await window.electronAPI.getThemes();
  themeSelector.innerHTML = themes.themes.map(theme => 
    `<option value="${theme.id}">${theme.name}</option>`
  ).join('');
  applyTheme(themes.themes[0].id);
}

function applyTheme(themeId) {
  const theme = themes.themes.find(t => t.id === themeId);
  if (!theme) return;
  editor.getWrapperElement().style.background = theme.editor.background;
  editor.getWrapperElement().style.color = theme.editor.color;
  editor.getWrapperElement().style.border = `1px solid ${theme.editor.border}`;
  preview.style.background = theme.preview.background;
  preview.style.color = theme.preview.color;
  sidebar.style.background = theme.sidebar.background;
  sidebar.style.color = theme.sidebar.color;
  document.querySelector('.toolbar').style.background = theme.toolbar.background;
  document.querySelector('.toolbar').style.color = theme.toolbar.color;
  document.body.style.background = theme.body.background;
  document.body.className = `theme-${themeId}`;
}

async function initEditor() {
  const textarea = document.getElementById('editor');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'markdown',
    lineNumbers: true,
    theme: 'default',
    lineWrapping: true
  });
  editor.on('change', () => {
    preview.innerHTML = marked.parse(editor.getValue());
  });
  editor.on('scroll', () => {
    const scrollInfo = editor.getScrollInfo();
    const scrollPercentage = scrollInfo.top / (scrollInfo.height - scrollInfo.clientHeight);
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
  });
  preview.addEventListener('scroll', () => {
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const scrollInfo = editor.getScrollInfo();
    editor.scrollTo(0, scrollPercentage * (scrollInfo.height - scrollInfo.clientHeight));
  });
}

themeSelector.addEventListener('change', () => {
  applyTheme(themeSelector.value);
});

newFileBtn.addEventListener('click', () => {
  editor.setValue('');
  preview.innerHTML = '';
  currentFilePath = null;
});

openFileBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile();
  if (result) {
    editor.setValue(result.content);
    preview.innerHTML = marked.parse(result.content);
    currentFilePath = result.filePath;
  }
});

saveFileBtn.addEventListener('click', async () => {
  const content = editor.getValue();
  const filePath = await window.electronAPI.saveFile(content, currentFilePath);
  if (filePath) {
    currentFilePath = filePath;
    alert(`Fichier sauvegardé à : ${filePath}`);
  }
});

exportPdfBtn.addEventListener('click', async () => {
  const content = editor.getValue();
  const filePath = await window.electronAPI.exportPDF(content);
  if (filePath) {
    alert(`PDF exporté à : ${filePath}`);
  }
});

newProjectBtn.addEventListener('click', async () => {
  const projectName = await window.electronAPI.promptProjectName();
  if (projectName) {
    await window.electronAPI.createProject(projectName);
    loadProjects();
  }
});

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

async function loadProjects() {
  const projects = await window.electronAPI.getProjects();
  projectList.innerHTML = '';
  for (const project of projects) {
    const projectItem = document.createElement('li');
    projectItem.textContent = project.name;
    projectItem.dataset.path = project.path;
    projectItem.addEventListener('click', async (e) => {
      e.stopPropagation();
      const projectPath = projectItem.dataset.path;
      console.log('Sending projectPath:', projectPath);
      if (!projectPath) {
        console.error('Project path is undefined');
        return;
      }
      try {
        const files = await window.electronAPI.getProjectFiles(projectPath);
        projectItem.innerHTML = `${project.name}<ul>${files.map(file => 
          `<li class="file" data-path="${file.path}">${file.name}</li>`
        ).join('')}</ul>`;
        projectItem.querySelectorAll('.file').forEach(fileItem => {
          fileItem.addEventListener('click', async (e) => {
            e.stopPropagation();
            const result = await window.electronAPI.openFile(fileItem.dataset.path);
            if (result) {
              editor.setValue(result.content);
              preview.innerHTML = marked.parse(result.content);
              currentFilePath = result.filePath;
            }
          });
        });
      } catch (error) {
        console.error('Error loading project files:', error);
      }
    });
    projectList.appendChild(projectItem);
  }
}

initEditor();
loadThemes();
loadProjects();
preview.innerHTML = marked.parse('');