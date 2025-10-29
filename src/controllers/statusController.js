import db from "../db/knex.js";

export async function getStatus(req, res) {
  try {
    const [{ count }] = await db("countries").count("id as count");

    // Fetch the most recent refresh timestamp
    const latest = await db("countries")
      .max("last_refreshed_at as last_refreshed_at")
      .first();

    res.json({
      total_countries: parseInt(count, 10),
      last_refreshed_at: latest?.last_refreshed_at || null,
    });
  } catch (err) {
    console.error("❌ Error fetching status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
