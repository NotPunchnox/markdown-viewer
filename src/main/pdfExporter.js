const PDFDocument = require('pdfkit');
const fs = require('fs');
const marked = require('marked');

async function exportToPDF(content, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const html = marked.parse(content);
    const text = html.replace(/<[^>]+>/g, '');
    doc.fontSize(12);
    doc.text(text, { align: 'left', indent: 30 });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}

module.exports = { exportToPDF };