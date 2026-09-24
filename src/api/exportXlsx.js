// The free (community) build of the `xlsx` library can't write cell colors,
// fonts, or borders — that's a paid-tier feature of the library itself, not
// something we can unlock from here. What it *does* support, and what this
// applies, is real column sizing (so text isn't truncated) and native Excel
// number formatting (thousand separators, a "so'm" suffix) — the two things
// that actually made the raw dump look bad.
export async function exportToXlsx({ filename, sheetName = 'Sheet1', columns, rows }) {
  const XLSX = await import('xlsx');

  const headers = columns.map((c) => c.header);
  const data = rows.map((row) => columns.map((c) => row[c.key]));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  sheet['!cols'] = columns.map((c) => ({ wch: c.width || 14 }));

  const NUMBER_FORMATS = {
    currency: `#,##0" so'm"`,
    number: '#,##0',
  };
  columns.forEach((c, colIdx) => {
    const numFmt = NUMBER_FORMATS[c.format];
    if (!numFmt) return;
    for (let r = 1; r <= data.length; r++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
      if (cell) cell.z = numFmt;
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
