# 🌍 Country Currency & Exchange API

A RESTful backend service that fetches country data from [REST Countries](https://restcountries.com) and currency exchange rates from [Open Exchange Rate API](https://open.er-api.com), then computes each country’s estimated GDP.
Data is cached in MySQL and accessible through CRUD endpoints, with summary image generation and status reporting.

---

## 🧱 Features

* Fetch all countries and cache in MySQL (`/countries/refresh`)
* Filter, sort, and list countries (`/countries?region=Africa&sort=gdp_desc`)
* Retrieve a single country (`/countries/:name`)
* Delete a country (`/countries/:name`)
* Generate and serve a summary image (`/countries/image`)
* Show API status and last refresh time (`/status`)
* Robust error handling and validation
* Cached data to avoid redundant API calls

---

## 🧰 Tech Stack

| Component                  | Technology  |
| -------------------------- | ----------- |
| **Runtime**                | Node.js     |
| **Framework**              | Express.js  |
| **Database**               | MySQL       |
| **Query Builder**          | Knex.js     |
| **Image Rendering**        | node-canvas |
| **Environment Management** | dotenv      |

---

## 📦 Project Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/country-currency-api.git
cd country-currency-api
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in the root directory:

```bash
PORT=3000

DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=countries_db
```

> 🧠 Tip: Never commit `.env` to GitHub — it should be in `.gitignore`.

---

## 🗄️ Database Setup

### 1️⃣ Create the MySQL Database

Open MySQL shell and create the DB manually:

```sql
CREATE DATABASE countries_db;
```

### 2️⃣ Configure Knex

Ensure your `knexfile.js` looks like this:

```js
import dotenv from "dotenv";
dotenv.config();

export default {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: "./migrations",
    },
  },
};
```

### 3️⃣ Run Migration

Create the table:

```bash
npx knex migrate:latest
```

### ✅ Database Schema

The `countries` table should include:

| Field             | Type                    | Description             |
| ----------------- | ----------------------- | ----------------------- |
| id                | INT, PK, AUTO_INCREMENT | Unique ID               |
| name              | VARCHAR                 | Country name            |
| capital           | VARCHAR                 | Capital city            |
| region            | VARCHAR                 | Continent/region        |
| population        | BIGINT                  | Population count        |
| currency_code     | VARCHAR                 | Currency ISO code       |
| exchange_rate     | FLOAT                   | Exchange rate to USD    |
| estimated_gdp     | DOUBLE                  | Computed GDP estimate   |
| flag_url          | VARCHAR                 | Flag image URL          |
| last_refreshed_at | DATETIME                | Last cache refresh time |

---

## 🚀 Running the Server

### Start the API

```bash
npm start
```

Server runs at:
👉 `http://localhost:3000`

---

## 🌐 API Endpoints

### 1️⃣ POST `/countries/refresh`

Fetches fresh country data and exchange rates from external APIs, computes GDP, and caches results in the database.
Also generates a summary image (`cache/summary.png`).

**Response (Example):**

```json
{
  "message": "Countries refreshed successfully",
  "last_refreshed_at": "2025-10-29T14:00:00Z"
}
```

**Error Cases:**

* 503 if external APIs fail
* 500 if DB or internal issue occurs

---

### 2️⃣ GET `/countries`

Fetches all cached countries with optional filters and sorting.

**Query Params:**

| Param      | Description             | Example                              |
| ---------- | ----------------------- | ------------------------------------ |
| `region`   | Filter by region        | `?region=Africa`                     |
| `currency` | Filter by currency code | `?currency=NGN`                      |
| `sort`     | Sort order              | `?sort=gdp_desc` or `?sort=name_asc` |

**Sample Response:**

```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-22T18:00:00Z"
  }
]
```

**Error:**

```json
{ "error": "No countries found" }
```

---

### 3️⃣ GET `/countries/:name`

Fetches one country by name (case-insensitive).

**Response:**

```json
{
  "id": 1,
  "name": "Ghana",
  "capital": "Accra",
  "region": "Africa",
  "population": 31072940,
  "currency_code": "GHS",
  "exchange_rate": 15.34,
  "estimated_gdp": 3029834520.6,
  "flag_url": "https://flagcdn.com/gh.svg",
  "last_refreshed_at": "2025-10-22T18:00:00Z"
}
```

**Error:**

```json
{ "error": "Country not found" }
```

---

### 4️⃣ DELETE `/countries/:name`

Deletes a country record from the database.

**Response:**

```json
{ "message": "Country 'Nigeria' deleted successfully" }
```

**Error:**

```json
{ "error": "Country not found" }
```

---

### 5️⃣ GET `/countries/image`

Serves the generated image summary.

**Success:** Returns a `.png` image.
**Error:**

```json
{ "error": "Summary image not found" }
```

---

### 6️⃣ GET `/status`

Returns the total number of countries and last refresh timestamp.

**Response:**

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00Z"
}
```

---

## 🧮 Estimated GDP Calculation

Each country’s `estimated_gdp` is computed as:

```
estimated_gdp = (population × random(1000–2000)) ÷ exchange_rate
```

* The random multiplier simulates approximate productivity.
* Recalculated on every refresh.
* If no currency or exchange rate is found, GDP is `0`.

---

## ⚠️ Error Handling & Validation

| Error Type               | Status | Example Response                                  |
| ------------------------ | ------ | ------------------------------------------------- |
| Missing fields           | 400    | `{ "error": "Validation failed" }`                |
| Country not found        | 404    | `{ "error": "Country not found" }`                |
| External API unavailable | 503    | `{ "error": "External data source unavailable" }` |
| Internal failure         | 500    | `{ "error": "Internal server error" }`            |

---

## 🧠 Developer Notes

* **Refresh caching:**
  Data updates only when `/countries/refresh` is called.

* **Image generation:**
  After each refresh, a summary PNG is generated under `/cache/summary.png`.

* **Multiple currencies:**
  Only the **first currency** in the API response is used.

* **Exchange rate not found:**
  `exchange_rate` and `estimated_gdp` will be `null`.

* **Database persistence:**
  Use MySQL 8+ with UTF-8 encoding for compatibility.

---

## 🧪 Testing Endpoints (Examples)

Using `curl`:

```bash
curl -X POST http://localhost:3000/countries/refresh
curl http://localhost:3000/countries?region=Africa&sort=gdp_desc
curl http://localhost:3000/countries/Nigeria
curl -X DELETE http://localhost:3000/countries/Ghana
curl http://localhost:3000/status
```

---

## 🖼️ Sample Summary Image

After refresh, the app creates `cache/summary.png` that looks like:

```
🌍 Country Summary
Total Countries: 250
Last Refresh: 2025-10-22T18:00:00Z

Top 5 by Estimated GDP:
1. United States — $123,456,789,000
2. China — $98,765,432,100
3. Japan — $78,654,321,000
...
```

---

## 🧑‍💻 Project Structure

```
├── app.js
├── routes/
│   ├── countries.js
│   └── status.js
├── controllers/
│   ├── countryController.js
│   └── statusController.js
├── db/
│   ├── db.js
│   └── knexfile.js
├── migrations/
│   └── 2025XXXX_create_countries_table.js
├── cache/
│   └── summary.png
├── .env
├── package.json
└── README.md
```

---

## 🧹 Maintenance Tips

* Run `/countries/refresh` periodically (daily/weekly) to update cache.
* Clean `/cache` folder occasionally if images accumulate.
* Monitor API rate limits for the external services.
* Handle large DB datasets efficiently using pagination (optional).

---

## 🏁 Conclusion

You’ve built a fully functional **Country Currency & Exchange API** with:

* Real-time data fetching
* Persistent caching
* Computed GDP analysis
* Dynamic image generation
* RESTful CRUD design

---