import express from "express";
import {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  getSummaryImage
} from "../controllers/countryController.js";

const router = express.Router();

// POST /countries/refresh
router.post("/refresh", refreshCountries);

// GET /countries
router.get("/", getAllCountries);

// GET /countries/:name
router.get("/:name", getCountryByName);

// DELETE /countries/:name
router.delete("/:name", deleteCountryByName);

// GET /countries/image
router.get("/image", getSummaryImage);

export default router;
