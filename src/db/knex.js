import knex from "knex";
import configModule from "../../knexfile.js";

const config = configModule.default || configModule; // support both CJS & ESM
const environment = process.env.NODE_ENV || "development";
const dbConfig = config[environment] || config.development;

const db = knex(dbConfig);

export default db;