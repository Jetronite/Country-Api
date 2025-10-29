import axios from "axios";
import knex from "knex";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
dotenv.config();

// Initialize Knex connection
const db = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "countries_db",
  },
});


async function generateSummaryImage() {
  // Get data for summary
  const [{ count }] = await db("countries").count("id as count");
  const topCountries = await db("countries")
    .orderBy("estimated_gdp", "desc")
    .limit(5);
  const latest = await db("countries")
    .max("last_refreshed_at as last_refreshed_at")
    .first();

  // Prepare canvas
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, width, height);

  // Header text
  ctx.fillStyle = "#222";
  ctx.font = "bold 28px Arial";
  ctx.fillText("🌍 Country Summary", 30, 50);

  ctx.font = "20px Arial";
  ctx.fillText(`Total Countries: ${count}`, 30, 100);
  ctx.fillText(`Last Refresh: ${new Date(latest.last_refreshed_at).toISOString()}`, 30, 130);

  ctx.font = "22px Arial";
  ctx.fillText("Top 5 by Estimated GDP:", 30, 180);

  ctx.font = "18px Arial";
  let y = 210;
  topCountries.forEach((c, i) => {
    ctx.fillText(`${i + 1}. ${c.name} — ${c.estimated_gdp.toLocaleString()} USD`, 40, y);
    y += 30;
  });

  // Save image to /cache/summary.png
  const cacheDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  const out = fs.createWriteStream(path.join(cacheDir, "summary.png"));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on("finish", () => console.log("✅ Summary image generated."));
}



/**
 * POST /countries/refresh
 * Fetch countries + exchange rates, compute GDP, and cache in DB
 */
export async function refreshCountries(req, res) {
  try {
    console.log("🔄 Refreshing countries...");

    // 1️⃣ Fetch countries
    const countriesRes = await axios.get(
      "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
    );

    // 2️⃣ Fetch exchange rates
    const ratesRes = await axios.get("https://open.er-api.com/v6/latest/USD");
    if (ratesRes.data.result !== "success") {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from Exchange Rate API",
      });
    }

    const exchangeRates = ratesRes.data.rates;
    const countries = countriesRes.data;
    const now = new Date();

    // 3️⃣ Loop through countries
    for (const c of countries) {
      const name = c.name;
      const capital = c.capital || null;
      const region = c.region || null;
      const population = c.population || 0;
      const flag_url = c.flag || null;

      let currency_code = null;
      let exchange_rate = null;
      let estimated_gdp = 0;

      if (Array.isArray(c.currencies) && c.currencies.length > 0) {
        currency_code = c.currencies[0].code;
        if (currency_code && exchangeRates[currency_code]) {
          exchange_rate = exchangeRates[currency_code];
          const randomMultiplier = Math.floor(Math.random() * 1001) + 1000; // 1000–2000
          estimated_gdp = (population * randomMultiplier) / exchange_rate;
        }
      }

      const countryData = {
        name,
        capital,
        region,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url,
        last_refreshed_at: now,
      };

      const existing = await db("countries")
        .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
        .first();

      if (existing) {
        await db("countries").where("id", existing.id).update(countryData);
      } else {
        await db("countries").insert(countryData);
      }
    }

    // 🖼️ 4️⃣ Generate summary image AFTER saving all data
    await generateSummaryImage();

    res.json({
      message: "Countries refreshed successfully",
      last_refreshed_at: now,
    });

    
  } catch (err) {
    console.error("❌ Error refreshing countries:", err.message);
    if (err.response) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${err.config.url}`,
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /countries
 * Supports filters: ?region=Africa | ?currency=USD
 * Supports sorting: ?sort=gdp_desc | ?sort=gdp_asc
 */
export async function getAllCountries(req, res) {
  try {
    const { region, currency, sort } = req.query;

    let query = db("countries").select(
      "id",
      "name",
      "capital",
      "region",
      "population",
      "currency_code",
      "exchange_rate",
      "estimated_gdp",
      "flag_url",
      "last_refreshed_at"
    );

    // 🔹 Filters
    if (region) {
      query = query.whereRaw("LOWER(region) = ?", [region.toLowerCase()]);
    }

    if (currency) {
      query = query.whereRaw("LOWER(currency_code) = ?", [currency.toLowerCase()]);
    }

    // 🔹 Sorting
    if (sort) {
      const sortLower = sort.toLowerCase();

      if (sortLower === "gdp_desc") query = query.orderBy("estimated_gdp", "desc");
      else if (sortLower === "gdp_asc") query = query.orderBy("estimated_gdp", "asc");
      else if (sortLower === "name_asc") query = query.orderBy("name", "asc");
      else if (sortLower === "name_desc") query = query.orderBy("name", "desc");
      else {
        return res.status(400).json({
          error: "Validation failed",
          details: { sort: "must be one of gdp_asc, gdp_desc, name_asc, name_desc" },
        });
      }
    }

    // 🔹 Run query
    const results = await query;

    if (!results.length) {
      return res.status(404).json({ error: "No countries found" });
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching countries:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /countries/:name
 * Fetch a single country by name (case-insensitive)
 */
export async function getCountryByName(req, res) {
  try {
    const { name } = req.params;
    const country = await db("countries")
      .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
      .first();

    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }

    res.json(country);
  } catch (err) {
    console.error("❌ Error fetching country:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * DELETE /countries/:name
 * Delete a country record by name
 */
export async function deleteCountryByName(req, res) {
  try {
    const { name } = req.params;
    const deleted = await db("countries")
      .whereRaw("LOWER(name) = ?", [name.toLowerCase()])
      .del();

    if (!deleted) {
      return res.status(404).json({ error: "Country not found" });
    }

    res.json({ message: `Country '${name}' deleted successfully` });
  } catch (err) {
    console.error("❌ Error deleting country:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /countries/image
 * Placeholder for summary image (to be implemented next)
 */

export async function getSummaryImage(req, res) {
  try {
    const imagePath = path.join(process.cwd(), "cache", "summary.png");

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Summary image not found" });
    }

    res.sendFile(imagePath);
  } catch (err) {
    console.error("❌ Error serving image:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
