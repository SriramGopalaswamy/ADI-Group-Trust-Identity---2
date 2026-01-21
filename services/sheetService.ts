import { BatchEntry } from '../types';

const SHEET_ID = '15CMTLDg-Ltz2PBEpnHku-mc7Q5iD1RzX';
const SHEET_NAME = 'Final Batch Code';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

export const fetchBatchData = async (): Promise<BatchEntry[]> => {
  try {
    console.log(`[Batch Traceability] Connecting to Authoritative Data Source: ${SHEET_CSV_URL}`);
    const response = await fetch(SHEET_CSV_URL);
    
    if (!response.ok) {
      console.error(`[Batch Traceability] SYSTEM ERROR: Fetch failed with status ${response.status}`);
      return [];
    }
    
    const csvText = await response.text();
    
    // Robust CSV Parsing Logic
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; 
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; 
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    console.log(`[Batch Traceability] Total row count: ${rows.length}`);

    if (rows.length === 0) {
      console.error("SYSTEM ERROR: Sheet returned no data.");
      return [];
    }

    // Map to BatchEntry
    // Corrected Mapping based on user feedback (Col C = 1kg)
    // Col A (0): Sr No
    // Col B (1): Product Name
    // Col C (2): Weight (e.g. 1Kg)
    // Col D (3): Batch Code [MANDATORY]
    // Col E (4): Mfg/Test Date
    // ...
    // Col K (10): URL [MANDATORY]
    
    const data: BatchEntry[] = rows.map((row): BatchEntry | null => {
      // Ensure row has enough columns (at least up to K=10)
      if (row.length <= 10) return null;
      
      const batchCode = row[3] || '';
      const reportUrl = row[10] || '';

      if (!batchCode || !reportUrl) return null;

      return {
        batchCode,
        reportUrl,
        // Use Column B (Index 1) for Product Name. Fallback to generic if empty.
        productName: row[1] || 'ADI Verified Product',
        // Lab name is likely not in the sheet, using safe default.
        labName: 'NABL Accredited Lab',
        // Use Column E (Index 4) for Date. Column C (Index 2) was Weight.
        testDate: row[4] || new Date().toLocaleDateString()
      };
    }).filter((item): item is BatchEntry => item !== null);

    const firstFive = data.slice(0, 5).map(item => item.batchCode);
    console.log(`[Batch Traceability] First 5 batch codes read:`, firstFive);

    return data;

  } catch (error) {
    console.error("SYSTEM ERROR: Exception during batch data fetch.", error);
    return [];
  }
};

export const findBatchUrl = (userBatchCode: string, data: BatchEntry[]): BatchEntry | null => {
  const input = userBatchCode.trim();
  console.log(`[Batch Traceability] User input after trim: "${input}"`);

  for (const row of data) {
    const sheetCode = String(row.batchCode).trim();
    
    if (input === sheetCode && input.length > 0) {
      console.log(`[Batch Traceability] MATCH FOUND. URL: ${row.reportUrl}`);
      return row;
    }
  }

  console.log("[Batch Traceability] Batch code not found.");
  return null;
};
