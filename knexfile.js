import dotenv from "dotenv";
dotenv.config();

export default {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "countries_db",
    },
    migrations: { directory: "./migrations", extension: "js" },
    pool: { min: 0, max: 7 },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    migrations: { directory: "./migrations", extension: "js" },
    pool: { min: 0, max: 7 },
  },
};
