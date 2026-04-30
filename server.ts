import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { aiServerService } from "./src/services/aiServerService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // AI Routes
  app.post("/api/ai/analyze-inventory", async (req, res) => {
    try {
      const { products, suppliers, shopName, language } = req.body;
      const result = await aiServerService.analyzeInventory(products, suppliers, shopName, language);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "AI Analysis failed" });
    }
  });

  app.post("/api/ai/ask-advisor", async (req, res) => {
    try {
      const { question, products, shopName, language } = req.body;
      const result = await aiServerService.askAdvisor(question, products, shopName, language);
      res.json({ text: result });
    } catch (error) {
      res.status(500).json({ error: "Advisor call failed" });
    }
  });

  app.post("/api/ai/parse-product", async (req, res) => {
    try {
      const { prompt } = req.body;
      const result = await aiServerService.parseProductFromPrompt(prompt);
      res.json({ products: result });
    } catch (error) {
      res.status(500).json({ error: "Product parsing failed" });
    }
  });

  app.post("/api/ai/process-command", async (req, res) => {
    try {
      const { command, context, language } = req.body;
      const result = await aiServerService.processCommand(command, context, language);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Command processing failed" });
    }
  });

  app.post("/api/ai/restock-plan", async (req, res) => {
    try {
      const { products, suppliers } = req.body;
      const result = await aiServerService.generateRestockPlan(products, suppliers);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Restock plan failed" });
    }
  });

  app.post("/api/ai/quick-status", async (req, res) => {
    try {
      const { products, language } = req.body;
      const result = await aiServerService.getQuickStatus(products, language);
      res.json({ text: result });
    } catch (error) {
      res.status(500).json({ error: "Quick status failed" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "SmartStock AI Backend Running" });
  });

  // Inventory API placeholder
  app.get("/api/inventory", (req, res) => {
    res.json([
      { id: "1", name: "Intel Core i7-13700K", sku: "CPU-i7-137", stockQuantity: 15, price: 95000 },
      { id: "2", name: "Samsung 980 Pro 1TB", sku: "SSD-SAM-980", stockQuantity: 25, price: 28000 },
    ]);
  });

  // Vite integration for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
