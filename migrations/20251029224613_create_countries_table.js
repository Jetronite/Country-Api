/**
 * Create countries table
 */
export async function up(knex) {
  await knex.schema.createTable("countries", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("capital", 255);
    table.string("region", 100);
    table.bigInteger("population").notNullable();
    table.string("currency_code", 10);
    table.double("exchange_rate");
    table.double("estimated_gdp");
    table.string("flag_url", 512);
    table.timestamp("last_refreshed_at").notNullable();
    table.unique(["name"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("countries");
}
