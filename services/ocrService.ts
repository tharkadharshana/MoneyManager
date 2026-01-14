import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptCandidate } from '../utils/matching';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64 part for Gemini
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf',
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const OCRService = {
  /**
   * Parses receipts and PDF documents using Gemini's native multimodal capabilities.
   * Returns a list of extracted transactions.
   */
  processPdf: async (file: File, password?: string): Promise<ReceiptCandidate[]> => {
    try {
        const filePart = await fileToGenerativePart(file);

        const prompt = `
          Analyze this financial document (bank statement, receipt, or invoice) and extract ALL financial transactions into a structured JSON list.
          
          Requirements:
          1. Extract a list of 'transactions'.
          2. For each transaction, extract:
             - merchantName: The vendor, store, or description.
             - date: ISO YYYY-MM-DD format.
             - amount: The amount (number). 
               * EXPENSES/DEBITS should be NEGATIVE. 
               * INCOME/DEPOSITS should be POSITIVE.
             - currency: The currency code (e.g., 'USD', 'LKR', 'EUR'). 
               * If you see 'Rs', 'Rs.', 'SLR' or 'LKR', return 'LKR'.
               * Default to 'USD' if not specified.
          3. If it is a receipt for a single purchase with multiple line items (e.g. coffee, bagel), extract the GRAND TOTAL as a single transaction.
          4. If it is a bank statement or list of unrelated transactions, extract EACH ROW as a separate transaction.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    filePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transactions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    merchantName: { type: Type.STRING },
                                    date: { type: Type.STRING },
                                    amount: { type: Type.NUMBER },
                                    currency: { type: Type.STRING }
                                },
                                required: ["merchantName", "amount", "date"]
                            }
                        }
                    }
                }
            }
        });

        if (!response.text) {
             throw new Error("No response from AI model");
        }

        const result = JSON.parse(response.text);
        
        if (!result.transactions || !Array.isArray(result.transactions)) {
            return [];
        }

        return result.transactions.map((t: any) => ({
            merchantName: t.merchantName || "Unknown",
            date: t.date ? new Date(t.date) : new Date(),
            amount: typeof t.amount === 'number' ? t.amount : 0,
            currency: t.currency || 'USD'
        }));

    } catch (error: any) {
        console.error("OCR Processing Error", error);
        return [];
    }
  }
};