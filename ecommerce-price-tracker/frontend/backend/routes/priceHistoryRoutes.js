const express = require("express");

const router = express.Router();

const {
    getPriceHistory
} = require("../controllers/priceHistoryController");


/*
==========================================
GET PRICE HISTORY
==========================================

Example:

GET /api/price-history/iPhone%2015

==========================================
*/

router.get(
    "/:productName",
    getPriceHistory
);


module.exports = router;