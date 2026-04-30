import { Product, Supplier } from "../types/index";

export interface AIInsight {
  summary: string;
  lowStockAlerts: string[];
  restockRecommendations: string[];
  overstockAlerts: string[];
  actionableInsights: string[];
}

export const aiService = {
  analyzeInventory: async (products: Product[], suppliers: Supplier[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<AIInsight> => {
    try {
      const response = await fetch("/api/ai/analyze-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, suppliers, shopName, language }),
      });
      if (!response.ok) throw new Error("Server AI Analysis failed");
      return await response.json();
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return {
        summary: "Unable to generate AI analysis at this moment. Please check your internet connection or try again later.",
        lowStockAlerts: ["Analysis unavailable"],
        restockRecommendations: ["Check inventory manually"],
        overstockAlerts: [],
        actionableInsights: []
      };
    }
  },

  askAdvisor: async (question: string, products: Product[], shopName: string, language: 'english' | 'roman_urdu' = 'english'): Promise<string> => {
    try {
      const response = await fetch("/api/ai/ask-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, products, shopName, language }),
      });
      if (!response.ok) throw new Error("Advisor call failed");
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("AI Advisor call failed:", error);
      return language === 'roman_urdu'
        ? "Bilkul mafi chahunga, thoda masla aa raha hai. Phir se koshish karein."
        : "I'm sorry, I'm having trouble analyzing your request right now. Please try again later.";
    }
  },

  parseProductFromPrompt: async (prompt: string): Promise<Partial<Product>[]> => {
    try {
      const response = await fetch("/api/ai/parse-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Product parsing failed");
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error("AI Product Parse failed:", error);
      return [];
    }
  },

  processCommand: async (command: string, context: { products: Product[], suppliers: Supplier[] }, language: 'english' | 'roman_urdu' = 'english'): Promise<{ action: string, data: any, response: string }> => {
    try {
      const response = await fetch("/api/ai/process-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, context, language }),
      });
      if (!response.ok) throw new Error("Command processing failed");
      return await response.json();
    } catch (error) {
      console.error("AI Command Process failed:", error);
      return { action: "UNKNOWN", data: {}, response: "Sorry, I couldn't understand that command." };
    }
  },

  generateRestockPlan: async (products: Product[], suppliers: Supplier[]): Promise<any> => {
    try {
      const response = await fetch("/api/ai/restock-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, suppliers }),
      });
      if (!response.ok) throw new Error("Restock plan failed");
      return await response.json();
    } catch (error) {
      console.error("AI Restock Plan failed:", error);
      return { plan: [], summary: "Failed to generate restock plan." };
    }
  },

  getQuickStatus: async (products: Product[], language: string): Promise<string> => {
    try {
      const response = await fetch("/api/ai/quick-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, language }),
      });
      if (!response.ok) throw new Error("Quick status failed");
      const data = await response.json();
      return data.text;
    } catch (error) {
      return "All systems go!";
    }
  }
};
