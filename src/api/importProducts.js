export const IMPORT_TEMPLATE_HEADERS = ['barcode', 'name', 'price', 'stock', 'unit'];

export function buildTemplateCsv() {
  return (
    IMPORT_TEMPLATE_HEADERS.join(',') +
    '\n4780012345678,Non,3000,50,dona' +
    '\n4780012345679,Pomidor,15000,25.5,kg\n'
  );
}

export function downloadTemplateCsv() {
  const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mahsulotlar-namuna.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseSpreadsheetFile(file) {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows.map((row) => {
    const normalized = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }
    return {
      barcode: String(normalized.barcode ?? '').trim(),
      name: String(normalized.name ?? '').trim(),
      price: normalized.price,
      stock: normalized.stock,
      unit: String(normalized.unit ?? '').trim(),
    };
  });
}
