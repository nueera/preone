import ExcelJS from 'exceljs';

interface ReportConfig {
  title: string;
  schoolName: string;
  dateRange: { from: string; to: string };
  generatedBy: string;
  type: string;
}

interface TableConfig {
  headers: string[];
  rows: (string | number | null)[][];
  columnWidths?: number[];
  sheetName?: string;
}

/**
 * Generate a PreOne-branded Excel report.
 * Returns a Buffer containing the .xlsx data.
 */
export async function generateExcel(config: ReportConfig, table: TableConfig): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PreOne';
  workbook.created = new Date();
  
  const sheetName = table.sheetName || config.type.charAt(0).toUpperCase() + config.type.slice(1);
  const worksheet = workbook.addWorksheet(sheetName);

  // ── Title Row (merged) ──
  worksheet.mergeCells(1, 1, 1, table.headers.length);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `${config.schoolName} — ${config.title}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF7C3AED' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  // ── Meta Info Rows ──
  const metaRow2 = worksheet.getRow(2);
  metaRow2.getCell(1).value = `Date Range: ${config.dateRange.from} to ${config.dateRange.to}`;
  metaRow2.getCell(1).font = { size: 9, color: { argb: 'FF666666' } };
  metaRow2.height = 18;

  const metaRow3 = worksheet.getRow(3);
  metaRow3.getCell(1).value = `Generated: ${new Date().toLocaleDateString('en-IN')} by ${config.generatedBy}`;
  metaRow3.getCell(1).font = { size: 9, color: { argb: 'FF666666' } };
  metaRow3.height = 18;

  // ── Empty Row ──
  worksheet.addRow([]);

  // ── Header Row (row 5) ──
  const headerRow = worksheet.addRow(table.headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF5B21B6' } },
    };
  });
  headerRow.height = 24;

  // ── Data Rows ──
  table.rows.forEach((row, idx) => {
    const dataRow = worksheet.addRow(row);
    dataRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
      };
      // Alternating row colors
      if (idx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      }
    });
    dataRow.height = 20;
  });

  // ── Column Widths ──
  if (table.columnWidths) {
    table.columnWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });
  } else {
    // Auto-fit: set width based on header length
    table.headers.forEach((header, i) => {
      worksheet.getColumn(i + 1).width = Math.max(header.length + 4, 12);
    });
  }

  // ── Freeze panes: freeze header row (row 5) ──
  worksheet.views = [{ state: 'frozen', ySplit: 5 }];

  // ── Auto-filter on data range ──
  const lastCol = String.fromCharCode(64 + table.headers.length);
  const lastRow = table.rows.length + 5;
  worksheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: lastRow, column: table.headers.length },
  };

  // ── Footer row ──
  worksheet.addRow([]);
  const footerRow = worksheet.addRow([`Total Records: ${table.rows.length}`]);
  footerRow.getCell(1).font = { size: 9, bold: true, color: { argb: 'FF7C3AED' } };

  // ── Write to buffer ──
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
