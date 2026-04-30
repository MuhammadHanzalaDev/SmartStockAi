import { GoogleGenAI, Type } from "@google/genai";
import { Product, Supplier } from "../types/index";

// Lazy fetch the API key to avoid crash on startup if missing
let client: GoogleGenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = "AIzaSyBOQxhjWI99QVqHkSUSMbB_FwhGXxVUWBs";
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface AIInsight {
  summary: string;
  lowStockAlerts: string[];
  restockRecommendations: string[];
  overstockAlerts: string[];
  actionableInsights: string[];
}

export const aiServerService = {
  analyzeInventory: async (products: Product[], suppliers: Supplier[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<AIInsight> => {
    try {
      const genAI = getClient();
      const inventoryText = products.map(p => {
        const supplier = suppliers.find(s => s.id === p.supplierId);
        return `- ${p.name}: ${p.stockQuantity} in stock (Min Threshold: ${p.thresholdLevel}, Price: Rs. ${p.price}${supplier ? `, Supplier: ${supplier.name}` : ''})`;
      }).join('\n');

      const languageInstruction = language === 'roman_urdu' 
        ? "Respond strictly in Roman Urdu (Urdu written in English script). Use simple and clear language. Start with 'Assalam-o-Alaikum' or 'Salam'."
        : "Respond strictly in professional and clear English. Avoid using 'Assalam-o-Alaikum' or 'Salam', use 'Hello' or 'Hi' instead.";

      const prompt = `
      Shop Name: ${shopName}
      Current Inventory Data:
      ${inventoryText}

      Please provide:
      1. A brief summary of current stock health.
      2. List of critical low stock items with "run-out" predictions (e.g., "Run out in 3 days").
      3. Practical restock recommendations matching items with their current suppliers.
      4. Identify "Dead Stock" (items with high quantity but low potential/slow movement).
      5. Price comparison advice if multiple suppliers could provide same items.

      Format the response as JSON. ${languageInstruction}
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are an expert tech inventory manager for electronics stores. 
          Your task is to analyze tech product data and provide actionable, simple insights.
          ${languageInstruction}
          Focus on identifying business risks (like stockouts), opportunities, and identifying dead stock.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              lowStockAlerts: { 
                type: "array", 
                items: { type: "string" } 
              },
              restockRecommendations: { 
                type: "array", 
                items: { type: "string" } 
              },
              overstockAlerts: { 
                type: "array", 
                items: { type: "string" } 
              },
              actionableInsights: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["summary", "lowStockAlerts", "restockRecommendations", "overstockAlerts", "actionableInsights"]
          }
        }
      });

      const responseText = result.text;
      if (!responseText) throw new Error("Empty response from AI");
      
      return JSON.parse(responseText) as AIInsight;
    } catch (error) {
      console.error("Server AI Analysis failed:", error);
      throw error;
    }
  },

  askAdvisor: async (question: string, products: Product[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<string> => {
    try {
      const genAI = getClient();
      const inventoryText = products.slice(0, 50).map(p => 
        `- ${p.name}: ${p.stockQuantity} stock (SKU: ${p.sku}, Price: Rs. ${p.price})`
      ).join('\n');

      const languageInstruction = language === 'roman_urdu' 
        ? "Respond strictly in Roman Urdu (Urdu written in English script). Use simple and clear language for a tech inventory specialist. Start with 'Assalam-o-Alaikum' or 'Salam'."
        : "Respond strictly in professional and clear English. Avoid using 'Assalam-o-Alaikum' or 'Salam', use 'Hello' or 'Hi' instead.";

      const prompt = `
      Context:
      Shop Name: ${shopName}
      Inventroy Data:
      ${inventoryText}

      Question: ${question}
      ${languageInstruction}
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are a "Business Advisor" for a SaaS tech inventory management tool. 
          Your goal is to provide short, actionable, and data-driven business advice based on the hardware and electronics inventory.
          Keep answers concise (max 3-4 sentences).
          ${languageInstruction}
          Be professional like a management consultant but friendly for a tech store manager.
          Focus on profit, stock levels, and technical efficiency.`
        }
      });

      return result.text || "No response from advisor.";
    } catch (error) {
      console.error("Server AI Advisor call failed:", error);
      throw error;
    }
  },

  parseProductFromPrompt: async (prompt: string): Promise<Partial<Product>[]> => {
    try {
      const genAI = getClient();
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse the following text for product information. Extract a list of products with their name, SKU (invent if not present), price, and stock quantity.
        Input text: "${prompt}"`,
        config: {
          systemInstruction: `You are a data extraction assistant. You take messy technical inventory notes or messages and turn them into a clear JSON list of hardware products.
          Strictly return a JSON object with a "products" array. 
          Each product should have: name (string), sku (string), price (number), stockQuantity (number).
          Use reasonable defaults if a value is missing (e.g., stock=1, sku=random).`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sku: { type: "string" },
                    price: { type: "number" },
                    stockQuantity: { type: "number" }
                  },
                  required: ["name", "sku", "price", "stockQuantity"]
                }
              }
            },
            required: ["products"]
          }
        }
      });

      const responseText = result.text;
      if (!responseText) return [];
      const parsed = JSON.parse(responseText);
      return parsed.products || [];
    } catch (error) {
      console.error("Server AI Product Parse failed:", error);
      throw error;
    }
  },

  processCommand: async (command: string, context: { products: Product[], suppliers: Supplier[] }, language: 'english' | 'roman_urdu' = 'english'): Promise<{ action: string, data: any, response: string }> => {
    try {
      const genAI = getClient();
      const languageInstruction = language === 'roman_urdu' 
        ? "Respond strictly in Roman Urdu (Urdu written in English script). Use simple and clear language. Be friendly like a shop assistant."
        : "Respond in clear professional English as a shop assistant.";

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Process the following command from a shop manager.
        Command: "${command}"
        Context: 
        Known Products: ${context.products.map(p => p.name).join(', ')}
        Known Suppliers: ${context.suppliers.map(s => s.name).join(', ')}`,
        config: {
          systemInstruction: `You are a helpful shop assistant named SmartStock AI. Turn natural language commands into structured actions.
          ${languageInstruction}
          
          Matching Strategy:
          - Use the "Known Products" and "Known Suppliers" provided in the context to match IDs or names even if the user's speech is slightly imprecise or the spelling varies.
          - If a product or supplier name in the command is similar to one of the known entities, map it to that entity.
          
          Supported Actions:
          - "ADD_STOCK": { name, quantity, price?, supplierName?, isUrgent: boolean }
          - "UPDATE_PRICE": { name, price }
          - "NAVIGATE": { page: 'dashboard' | 'inventory' | 'advisor' | 'analytics' | 'suppliers' }
          - "SEARCH": { query }
          - "UNKNOWN": {}
          
          IMPORTANT: If the user is speaking in Roman Urdu, ensure the "response" field is also in natural, friendly Roman Urdu.
          Example: "Add 50 processors from supplier Ali Traders"
          Result: { "action": "ADD_STOCK", "data": { "name": "processors", "quantity": 50, "supplierName": "Ali Traders" }, "response": "Theek hai, main ne Ali Traders se 50 processors add kar diye hain." }

          Return a JSON object: { action, data, response }.
          The "response" should be a friendly confirmation.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              data: { type: Type.OBJECT },
              response: { type: Type.STRING }
            },
            required: ["action", "data", "response"]
          }
        }
      });

      return JSON.parse(result.text || "{}");
    } catch (error) {
      console.error("Server AI Command Process failed:", error);
      throw error;
    }
  },

  generateRestockPlan: async (products: Product[], suppliers: Supplier[]): Promise<any> => {
    try {
      const genAI = getClient();
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this inventory and suggest a restock plan.
        Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stockQuantity, threshold: p.thresholdLevel, price: p.price })))}
        Suppliers: ${JSON.stringify(suppliers.map(s => ({ name: s.name, category: s.category })))}`,
        config: {
          systemInstruction: `You are a supply chain expert for electronics and hardware stores. 
          Identify products that are low or will be low soon. 
          Match them with the best technical supplier from the list based on hardware category.
          Suggest quantities to order based on current stock vs. 2x threshold.
          Include a "simulatedCost" field which is suggestedQuantity * price.
          Include "reasoning" for each item (e.g., "High demand, low stock").
          Return a JSON object with a "plan" array of { productName, supplierName, suggestedQuantity, urgency: 'high'|'medium'|'low', simulatedCost, reasoning } and a "summary" string.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    supplierName: { type: Type.STRING },
                    suggestedQuantity: { type: Type.NUMBER },
                    urgency: { type: Type.STRING },
                    simulatedCost: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["productName", "supplierName", "suggestedQuantity", "urgency", "simulatedCost", "reasoning"]
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["plan", "summary"]
          }
        }
      });

      return JSON.parse(result.text || "{}");
    } catch (error) {
      console.error("Server AI Restock Plan failed:", error);
      throw error;
    }
  },

  getQuickStatus: async (products: Product[], language: string): Promise<string> => {
    try {
      const genAI = getClient();
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Inventory: ${JSON.stringify(products.map(p => ({ n: p.name, s: p.stockQuantity, p: p.price })))}`,
        config: {
          systemInstruction: `You are a savvy business mentor. Give a one-sentence "vibe check" of the tech inventory status. 
          Be encouraging but honest. Mention something specific from the technical inventory.
          Respond in ${language === 'roman_urdu' ? 'Roman Urdu (Urdu in English script)' : 'English'}.
          Keep it under 15 words. Example: "Processors are selling fast, but stock is low. Order more!"`,
        }
      });
      return result.text || "Everything is looking good!";
    } catch (error) {
      console.error("Server Quick Status failed:", error);
      throw error;
    }
  }
};
