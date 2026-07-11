const PAGE_WIDTH = 792; // US Letter landscape - report rows tend to be wide.
const PAGE_HEIGHT = 612;
const MARGIN = 36;
const FONT_SIZE = 8;
const LINE_HEIGHT = 11;
const MAX_LINE_CHARS = 150;
const LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT);

function escapePdfText(text: string): string {
  return text
    .slice(0, MAX_LINE_CHARS)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * The Sprint 23 "Export: PDF" format, hand-rolled rather than adding a PDF
 * dependency (pdfkit/puppeteer) to a backend that has none - a single-Type1-
 * font, multi-page, monospaced-text PDF is a well-documented minimal PDF
 * structure (catalog -> pages -> one content stream per page, plus a plain
 * xref table). Good enough for a tabular report export; not a general
 * rendering engine.
 */
export function buildSimplePdf(title: string, lines: string[]): Buffer {
  const allLines = [title, '', ...lines];
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pages.push(allLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) {
    pages.push(['']);
  }

  const pageCount = pages.length;
  const contentObjNums: number[] = [];
  const pageObjNums: number[] = [];
  let nextNum = 3;
  for (let i = 0; i < pageCount; i++) {
    contentObjNums.push(nextNum++);
    pageObjNums.push(nextNum++);
  }
  const fontObjNum = nextNum;
  const totalObjects = fontObjNum;

  const objects: string[] = new Array(totalObjects + 1).fill('');
  objects[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`;

  for (let i = 0; i < pageCount; i++) {
    const contentNum = contentObjNums[i];
    const pageNum = pageObjNums[i];
    const body = pages[i].map((line) => `(${escapePdfText(line)}) Tj T*`).join('\n');
    const stream = `BT /F1 ${FONT_SIZE} Tf ${MARGIN} ${PAGE_HEIGHT - MARGIN} Td ${LINE_HEIGHT} TL\n${body}\nET`;
    objects[contentNum] =
      `${contentNum} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf-8')} >>\nstream\n${stream}\nendstream\nendobj\n`;
    objects[pageNum] =
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentNum} 0 R >>\nendobj\n`;
  }
  objects[fontObjNum] = `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 1; i <= totalObjects; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += objects[i];
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjects; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}
