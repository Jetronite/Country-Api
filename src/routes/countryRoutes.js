import express from "express";
import { refreshCountries } from "../controllers/countryController.js";

const router = express.Router();

// POST /countries/refresh
router.post("/refresh", refreshCountries);

export default router;
