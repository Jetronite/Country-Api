import express from "express";
import dotenv from "dotenv";
import countriesRouter from "./routes/countries.js";
import statusRouter from "./routes/status.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "🌍 Country Currency API is live", endpoints: ["/status", "/countries"] });
});


// Routes
app.use("/countries", countriesRouter);
app.use("/status", statusRouter);

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
