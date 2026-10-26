// يبني مجلد مكتبة تجريبي (PDF, DOCX, صور, نصوص, فيديو وهمي) للاختبارات فقط. لا يُستخدم في التشغيل العادي.
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

export function makePdf(pages = ['Hello Library']) {
  const objs = [];
  const add = (s) => objs.push(s);
  add('<< /Type /Catalog /Pages 2 0 R >>');
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
  add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pages.forEach((t, i) => {
    const content = `BT /F1 36 Tf 72 700 Td (${t.replace(/[()\\]/g, '')}) Tj ET`;
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`);
    add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

export async function makeDocx(text) {
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`);
  return z.generateAsync({ type: 'nodebuffer' });
}

// PNG 1x1 شفاف
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/** @returns {Promise<string>} الجذر */
export async function buildLibraryFixture(dir) {
  const w = (rel, data) => {
    const p = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data);
  };
  w('Year 3/Semester 1/SCSE3103 Cognitive Computing/Lectures/Lecture 1 Intro.pdf', makePdf(['Lecture One', 'Second Page', 'Third Page']));
  w('Year 3/Semester 1/SCSE3103 Cognitive Computing/Labs/Lab 2 Report.docx', await makeDocx('Lab report body text'));
  w('Year 3/Semester 1/SCSE3103 Cognitive Computing/Quizzes/quiz1 answers.txt', 'Quiz answers: 42\n');
  w('Year 3/Semester 1/SCSE3143 Ubiquitous Computing/notes summary.md', '# Summary\nمرحبا\n');
  w('Year 3/Semester 1/SCSE3143 Ubiquitous Computing/Slides week 3.pptx', Buffer.from('PK-not-a-real-pptx'));
  w('Year 2/Semester 2/Past Year Exam 2024.pdf', makePdf(['Past exam']));
  w('Misc/diagram.png', PNG);
  w('Misc/clip.mp4', Buffer.alloc(20000, 7));
  w('Misc/old.mkv', Buffer.alloc(100, 1));
  w('Misc/archive.zip', Buffer.from('PK'));
  // يجب تجاهلها:
  w('.hidden/secret.txt', 'x');
  w('node_modules/pkg/index.js', 'x');
  w('Misc/~$temp.docx', 'x');
  w('Misc/desktop.ini', 'x');
  return dir;
}
