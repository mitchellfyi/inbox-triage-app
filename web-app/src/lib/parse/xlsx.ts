/**
 * Excel/CSV parsing using SheetJS to extract and summarise spreadsheet data
 */

import * as XLSX from 'xlsx';
import type { ParsedContent, ParseOptions } from '../../types/attachment';
import { cleanText, truncateText } from './utils';

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  maxPages: 10, // Max sheets to process
  maxRows: 1000, // Max rows per sheet
  includeImages: false, // Not applicable for spreadsheets
};

/**
 * Parse XLSX/XLS/CSV file and extract structured data
 */
export async function parseSpreadsheet(file: File, options: ParseOptions = {}): Promise<ParsedContent> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in the spreadsheet');
    }
    
    const sheetTexts: string[] = [];
    const sheetNames: string[] = [];
    const sheetsToProcess = Math.min(workbook.SheetNames.length, opts.maxPages);
    
    // Process each sheet
    for (let i = 0; i < sheetsToProcess; i++) {
      const sheetName = workbook.SheetNames[i];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) continue;
      
      try {
        const sheetText = processWorksheet(worksheet, sheetName, opts.maxRows);
        if (sheetText.trim()) {
          sheetTexts.push(sheetText);
          sheetNames.push(sheetName);
        }
      } catch (sheetError) {
        console.warn(`Failed to process sheet "${sheetName}":`, sheetError);
        continue;
      }
    }
    
    if (sheetTexts.length === 0) {
      throw new Error('No data could be extracted from the spreadsheet');
    }
    
    const fullText = sheetTexts.join('\n\n---\n\n');
    const cleanedText = cleanText(fullText);
    
    // Truncate if too long (keeping roughly 50k characters for processing)
    const finalText = cleanedText.length > 50000 
      ? truncateText(cleanedText, 8000) 
      : cleanedText;
    
    return {
      text: finalText,
      metadata: {
        sheetCount: sheetTexts.length,
        sheetNames,
        wordCount: finalText.split(/\s+/).length,
      },
    };
  } catch (error) {
    console.error('Spreadsheet parsing failed:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse spreadsheet: ${error.message}`
        : 'Failed to parse spreadsheet: Unknown error'
    );
  }
}

/**
 * Process a single worksheet and extract meaningful data
 */
function processWorksheet(worksheet: XLSX.WorkSheet, sheetName: string, maxRows: number): string {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const endRow = Math.min(range.e.r, maxRows - 1);
  const endCol = Math.min(range.e.c, 25); // Limit to 26 columns (A-Z)
  
  const rows: string[][] = [];
  
  // Extract data row by row
  for (let row = range.s.r; row <= endRow; row++) {
    const rowData: string[] = [];
    
    for (let col = range.s.c; col <= endCol; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v !== undefined) {
        rowData.push(String(cell.v).trim());
      } else {
        rowData.push('');
      }
    }
    
    // Only include rows that have at least some data
    if (rowData.some(cell => cell.length > 0)) {
      rows.push(rowData);
    }
  }
  
  if (rows.length === 0) {
    return '';
  }
  
  // Format the data as text
  let sheetText = `Sheet: ${sheetName}\n`;
  
  // Identify if the first row contains headers
  const firstRow = rows[0];
  const hasHeaders = firstRow.every(cell => 
    cell.length > 0 && isNaN(Number(cell)) && cell.length < 50
  );
  
  if (hasHeaders && rows.length > 1) {
    // Format as table with headers
    sheetText += '\nHeaders: ' + firstRow.join(' | ') + '\n';
    
    // Add a few sample rows
    const sampleRows = rows.slice(1, Math.min(6, rows.length));
    sampleRows.forEach((row, index) => {
      sheetText += `Row ${index + 1}: ${row.join(' | ')}\n`;
    });
    
    // Add summary statistics if numeric data is present
    const numericSummary = analyseNumericData(rows.slice(1), firstRow);
    if (numericSummary) {
      sheetText += '\nNumeric Summary:\n' + numericSummary;
    }
    
    if (rows.length > 6) {
      sheetText += `\n... and ${rows.length - 6} more rows`;
    }
  } else {
    // Format as simple text data
    const sampleRows = rows.slice(0, Math.min(10, rows.length));
    sampleRows.forEach((row, index) => {
      if (row.some(cell => cell.length > 0)) {
        sheetText += `${row.join(' | ')}\n`;
      }
    });
    
    if (rows.length > 10) {
      sheetText += `... and ${rows.length - 10} more rows`;
    }
  }
  
  return sheetText;
}

/**
 * Analyse numeric columns and provide summary statistics
 */
function analyseNumericData(dataRows: string[][], headers: string[]): string | null {
  const numericColumns: { [key: string]: number[] } = {};
  
  // Identify numeric columns
  headers.forEach((header, colIndex) => {
    const values: number[] = [];
    
    dataRows.forEach(row => {
      const cell = row[colIndex];
      if (cell && !isNaN(Number(cell))) {
        values.push(Number(cell));
      }
    });
    
    // Consider it numeric if at least 70% of values are numbers
    if (values.length >= dataRows.length * 0.7 && values.length > 0) {
      numericColumns[header] = values;
    }
  });
  
  if (Object.keys(numericColumns).length === 0) {
    return null;
  }
  
  let summary = '';
  Object.entries(numericColumns).forEach(([header, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    summary += `${header}: Sum=${sum.toLocaleString()}, Avg=${avg.toFixed(2)}, Min=${min}, Max=${max}\n`;
  });
  
  return summary;
}

/**
 * Check if spreadsheet parsing is supported in the current environment
 */
export function isSpreadsheetParsingSupported(): boolean {
  return typeof window !== 'undefined';
}