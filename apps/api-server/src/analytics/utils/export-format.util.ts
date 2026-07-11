function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Plain CSV - the Sprint 23 "Export: CSV" format. */
export function toCsv(columns: string[], rows: (string | number)[][]): Buffer {
  const lines = [
    columns.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ];
  return Buffer.from(lines.join('\n'), 'utf-8');
}

function escapeHtml(value: string | number): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The Sprint 23 "Export: Excel" format, without adding an xlsx/exceljs
 * dependency to a backend that has none: an HTML `<table>` served with the
 * `application/vnd.ms-excel` content type and a `.xls` extension, which
 * Excel (and Google Sheets/LibreOffice) opens natively - a long-standing,
 * dependency-free technique for exactly this case.
 */
export function toExcelHtml(title: string, columns: string[], rows: (string | number)[][]): Buffer {
  const header = `<tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>`;
  const body = rows
    .map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`)
    .join('');
  const html = `<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><table border="1">${header}${body}</table></body></html>`;
  return Buffer.from(html, 'utf-8');
}
