import dotenv from "dotenv";
dotenv.config();

/**
 * Knex configuration for ESM projects
 */
export default {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "countries_db",
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    pool: { min: 0, max: 7 },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,

      // ✅ This is the key fix for Railway deployments:
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    pool: { min: 2, max: 10 },
  },
};
