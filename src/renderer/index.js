const marked = require('marked');
const hljs = require('highlight.js');

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const themeSelector = document.getElementById('theme-selector');
const saveBtn = document.getElementById('save-btn');
const exportBtn = document.getElementById('export-btn');

// Mise à jour de la prévisualisation
editor.addEventListener('input', () => {
  preview.innerHTML = marked.parse(editor.value);
});

// Gestion des thèmes
themeSelector.addEventListener('change', () => {
  document.body.className = `theme-${themeSelector.value}`;
});

// Sauvegarde du fichier
saveBtn.addEventListener('click', async () => {
  const content = editor.value;
  const filePath = await window.electronAPI.saveFile(content);
  if (filePath) {
    alert(`Fichier sauvegardé à : ${filePath}`);
  }
});

// Exportation PDF
exportBtn.addEventListener('click', async () => {
  const content = editor.value;
  const filePath = await window.electronAPI.exportPDF(content);
  if (filePath) {
    alert(`PDF exporté à : ${filePath}`);
  }
});

// Initialisation
document.body.className = 'theme-light';
preview.innerHTML = marked.parse(editor.value);
