const express = require("express");

const router = express.Router();

const {
    addPrice,
    getAllPrices,
    searchPrices
} = require("../controllers/priceController");


// =====================================================
// ADD OR UPDATE PRICE
// POST /api/prices
// =====================================================

router.post(
    "/",
    addPrice
);


// =====================================================
// GET ALL PRICES
// GET /api/prices
// =====================================================

router.get(
    "/",
    getAllPrices
);


// =====================================================
// SEARCH PRODUCT PRICES
// GET /api/prices/search?productName=iPhone
// =====================================================

router.get(
    "/search",
    searchPrices
);


module.exports = router;