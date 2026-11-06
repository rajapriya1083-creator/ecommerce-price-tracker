const express = require("express");

const router = express.Router();

const {

    createPriceAlert,

    getPriceAlerts,

    updatePriceAlert,

    deletePriceAlert,

    checkPriceAlerts,

    getDroppedPrices

} = require("../controllers/priceAlertController");


// ==========================================
// CREATE ALERT
// ==========================================

router.post(
    "/",
    createPriceAlert
);


// ==========================================
// GET ALL ALERTS
// ==========================================

router.get(
    "/",
    getPriceAlerts
);


// ==========================================
// UPDATE ALERT
// ==========================================

router.put(
    "/:id",
    updatePriceAlert
);


// ==========================================
// DELETE ALERT
// ==========================================

router.delete(
    "/:id",
    deletePriceAlert
);


// ==========================================
// CHECK ALERTS
// ==========================================

router.post(
    "/check",
    checkPriceAlerts
);


// ==========================================
// REACHED ALERTS
// ==========================================

router.get(
    "/dropped",
    getDroppedPrices
);


module.exports = router;