import * as pdfjsLib from 'pdfjs-dist';
import { ReceiptCandidate } from '../utils/matching';

// Configure Worker (Browser compatible)
// Handle potential default export structure from some ESM providers (esm.sh)
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs';
}

interface TextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, x, y]
  width: number;
  height: number;
  hasEOL?: boolean;
}

interface ParsedLine {
  y: number;
  text: string;
  items: TextItem[];
}

interface ParsedTransaction {
  date?: string;
  description?: string;
  amount?: number;
  balance?: number;
  rawLine: string;
}

export const OCRService = {
  /**
   * advanced PDF parsing logic
   */
  processPdf: async (file: File, password?: string): Promise<ReceiptCandidate> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Use the resolved pdfjs object to call getDocument
        const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            password: password,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        const allTextItems: TextItem[] = [];

        // Step 1: Extract text from all pages with positioning
        // Limit to 2 pages for performance on receipts/short statements
        const maxPages = Math.min(numPages, 2);
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const items: TextItem[] = textContent.items.map((item: any) => ({
                str: item.str,
                transform: item.transform,
                width: item.width,
                height: item.height,
                hasEOL: item.hasEOL,
            }));

            allTextItems.push(...items);
        }

        // Step 2: Group items into lines using Y-position clustering
        const Y_TOLERANCE = 4;
        const lines: ParsedLine[] = [];
        let currentLine: ParsedLine | null = null;

        // Sort: Top to Bottom (Y desc), then Left to Right (X asc)
        allTextItems.sort((a, b) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            // Note: PDF coordinates usually have (0,0) at bottom-left, so higher Y is higher on page.
            if (Math.abs(yA - yB) > Y_TOLERANCE) return yB - yA; 
            return a.transform[4] - b.transform[4];
        });

        allTextItems.forEach((item) => {
            const y = item.transform[5];
            if (!currentLine || Math.abs(y - currentLine.y) > Y_TOLERANCE) {
                if (currentLine) lines.push(currentLine);
                currentLine = { y, text: '', items: [] };
            }
            // Add space if items are far apart horizontally? Simple concatenation for now.
            currentLine.text += item.str + (item.hasEOL ? '\n' : ' ');
            currentLine.items.push(item);
        });
        if (currentLine) lines.push(currentLine);

        // Step 3: Clean lines
        const rawLines = lines.map(l => l.text.trim()).filter(t => t.length > 0);

        // Step 4: Detect Table / Extract Transactions
        const transactions = OCRService.parseTransactionsFromLines(rawLines);

        // Step 5: Convert to ReceiptCandidate
        
        const fullText = rawLines.join('\n');
        
        let bestCandidate: ReceiptCandidate = {
            merchantName: file.name.replace(/\.[^/.]+$/, ""),
            date: new Date(),
            amount: 0
        };

        if (transactions.length > 0) {
            // Find largest amount (assuming receipt total or biggest purchase)
            const maxTx = transactions.reduce((prev, current) => {
                const prevAmt = Math.abs(prev.amount || 0);
                const currAmt = Math.abs(current.amount || 0);
                return (currAmt > prevAmt) ? current : prev;
            });

            if (maxTx && maxTx.amount) {
                bestCandidate.amount = Math.abs(maxTx.amount);
                if (maxTx.date) {
                    const parsedDate = new Date(maxTx.date);
                    if (!isNaN(parsedDate.getTime())) bestCandidate.date = parsedDate;
                }
                if (maxTx.description) {
                     // Clean up description
                     bestCandidate.merchantName = maxTx.description.substring(0, 30).trim();
                }
            }
        } else {
            // Fallback to regex on full text if table parsing failed (e.g. simple receipt)
            bestCandidate = OCRService.parseSimpleReceipt(fullText, file.name);
        }

        return bestCandidate;

    } catch (error: any) {
        if (error.name === 'PasswordException') {
            throw new Error('PASSWORD_REQUIRED');
        }
        console.error("PDF Parse Error", error);
        throw error;
    }
  },

  parseTransactionsFromLines: (rawLines: string[]): ParsedTransaction[] => {
      // Heuristics to find table start
      const headerKeywords = ['date', 'transaction', 'description', 'particulars', 'debit', 'credit', 'amount', 'balance'];
      const tableStartIdx = rawLines.findIndex(line => 
        headerKeywords.some(kw => line.toLowerCase().includes(kw))
      );

      // If headers found, start after them. Else scan all.
      let tableLines = tableStartIdx >= 0 ? rawLines.slice(tableStartIdx + 1) : rawLines;

      // Filter footer
      const footerKeywords = ['total', 'balance b/f', 'balance c/f', 'page', 'ending balance'];
      
      const transactions: ParsedTransaction[] = [];
      const dateRegex = /(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})|(\d{4}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{1,2})/;
      const amountRegex = /([\d,]+\.?\d{2})/g; // Looking for 2 decimal places specifically for strictness, or loosen if needed

      for (const rawLine of tableLines) {
          const line = rawLine.trim();
          if (!line || footerKeywords.some(kw => line.toLowerCase().includes(kw))) continue;

          const dateMatch = line.match(dateRegex);
          const amounts = line.match(amountRegex)?.map(a => parseFloat(a.replace(/,/g, ''))) || [];

          let amount = 0;
          if (amounts.length >= 1) {
              // Logic: If "Dr" or "Debit" present, it's negative.
              // If multiple amounts, usually Last is Balance, 2nd Last is Tx Amount
              const val = amounts.length > 1 ? amounts[amounts.length - 2] : amounts[0];
              
              if (line.toLowerCase().includes('dr') || line.toLowerCase().includes('debit') || line.toLowerCase().includes('withdrawal')) {
                  amount = -Math.abs(val);
              } else if (line.toLowerCase().includes('cr') || line.toLowerCase().includes('credit') || line.toLowerCase().includes('deposit')) {
                   amount = Math.abs(val);
              } else {
                   // Default assumption for receipts: it's an expense (amount to pay)
                   amount = val;
              }
          }

          let description = line;
          if (dateMatch) {
              description = description.replace(dateMatch[0], '').trim();
          }
          description = description.replace(/[\d,]+\.?\d*/g, '').replace(/DR|CR|Dr|Cr/i, '').trim();

          if (dateMatch || amount !== 0) {
              transactions.push({
                  date: dateMatch?.[0],
                  description: description,
                  amount: amount,
                  balance: amounts.length > 1 ? amounts[amounts.length - 1] : undefined,
                  rawLine: line
              });
          }
      }
      return transactions;
  },

  // Fallback for non-tabular receipts (like gas station slips)
  parseSimpleReceipt: (text: string, filename: string): ReceiptCandidate => {
    // 1. Date
    const datePattern = /(\d{1,2}[-./]\d{1,2}[-./]\d{2,4})|(\d{4}[-./]\d{1,2}[-./]\d{1,2})/;
    const dateMatch = text.match(datePattern);
    let date = new Date();
    if (dateMatch) {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) date = parsedDate;
    }

    // 2. Amount
    const amountPattern = /[\$£€]?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g;
    const matches = [...text.matchAll(amountPattern)];
    let maxAmount = 0;
    matches.forEach(match => {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > maxAmount && val < 100000) maxAmount = val;
    });

    // 3. Merchant
    let merchant = filename.replace(/\.[^/.]+$/, "");
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    // Common logic: Merchant is often the first non-numeric line centered or at top
    const possibleMerchant = lines.find(l => !/\d/.test(l) && l.length < 30 && l.length > 3);
    if (possibleMerchant) merchant = possibleMerchant;

    return {
        merchantName: merchant,
        date: date,
        amount: maxAmount
    };
  }
};