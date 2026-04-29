import { GoogleGenAI } from "@google/genai";
import { Product, Supplier } from "../types";

export interface AIInsight {
  summary: string;
  lowStockAlerts: string[];
  restockRecommendations: string[];
  overstockAlerts: string[];
  actionableInsights?: string[];
}

let genAIInstance: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAIInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in the Secrets panel.");
    }
    genAIInstance = new GoogleGenAI(apiKey);
  }
  return genAIInstance;
};

export const aiService = {
  analyzeInventory: async (products: Product[], suppliers: Supplier[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<AIInsight> => {
    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as any,
            properties: {
              summary: { type: "string" as any },
              lowStockAlerts: { type: "array" as any, items: { type: "string" as any } },
              restockRecommendations: { type: "array" as any, items: { type: "string" as any } },
              overstockAlerts: { type: "array" as any, items: { type: "string" as any } },
              actionableInsights: { type: "array" as any, items: { type: "string" as any } }
            },
            required: ["summary", "lowStockAlerts", "restockRecommendations", "overstockAlerts", "actionableInsights"]
          }
        }
      });

      const inventoryText = products.map(p => {
        const supplier = suppliers.find(s => s.id === p.supplierId);
        return `- ${p.name}: ${p.stockQuantity} in stock (Min Threshold: ${p.thresholdLevel}, Price: Rs. ${p.price}${supplier ? `, Supplier: ${supplier.name}` : ''})`;
      }).join('\n');

      const languageInstruction = language === 'roman_urdu' 
        ? "Respond strictly in Roman Urdu (Urdu written in English script). Use simple and clear language. Start with 'Assalam-o-Alaikum' or 'Salam'."
        : "Respond strictly in professional and clear English.";

      const prompt = `
      Shop Name: ${shopName}
      Current Inventory Data:
      ${inventoryText}

      Please provide analysis. ${languageInstruction}
      `;

      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return {
        summary: "AI Analysis currently unavailable. Please check your system configuration.",
        lowStockAlerts: [],
        restockRecommendations: [],
        overstockAlerts: [],
        actionableInsights: []
      };
    }
  },

  askAdvisor: async (question: string, products: Product[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<string> => {
    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are an expert tech business advisor. ${language === 'roman_urdu' ? 'Respond in Roman Urdu.' : 'Respond in English.'}`
      });
      const inventoryText = products.slice(0, 20).map(p => `- ${p.name}: ${p.stockQuantity}`).join('\n');
      const prompt = `Context: ${shopName}\nInventory:\n${inventoryText}\n\nQuestion: ${question}`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return "I'm having trouble responding right now.";
    }
  },

  parseProductFromPrompt: async (prompt: string): Promise<Partial<Product>[]> => {
    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as any,
            properties: {
              products: {
                type: "array" as any,
                items: {
                  type: "object" as any,
                  properties: {
                    name: { type: "string" as any },
                    sku: { type: "string" as any },
                    price: { type: "number" as any },
                    stockQuantity: { type: "number" as any }
                  }
                }
              }
            }
          }
        }
      });
      const result = await model.generateContent(`Extract products from: "${prompt}"`);
      const data = JSON.parse(result.response.text());
      return data.products || [];
    } catch {
      return [];
    }
  },

  processCommand: async (command: string, context: { products: Product[], suppliers: Supplier[] }, language: 'english' | 'roman_urdu' = 'english'): Promise<{ action: string, data: any, response: string }> => {
    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `Commands: ADD_STOCK, NAVIGATE. Input: "${command}"\nLanguage: ${language}`;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch {
      return { action: "UNKNOWN", data: {}, response: "Error processing command" };
    }
  },

  generateRestockPlan: async (products: Product[], suppliers: Supplier[]): Promise<any> => {
    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `Generate restock plan for: ${JSON.stringify(products.filter(p => p.stockQuantity <= p.thresholdLevel))}`;
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch {
      return { plan: [], summary: "Failed to generate plan." };
    }
  },

  getQuickStatus: async (products: Product[], language: string): Promise<string> => {
    try {
      const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Give a 1-sentence vibe check in ${language === 'roman_urdu' ? 'Roman Urdu' : 'English'} for: ${JSON.stringify(products.slice(0, 5))}`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch {
      return "All systems go!";
    }
  }
};
