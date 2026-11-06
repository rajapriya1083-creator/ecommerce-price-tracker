const express = require("express");

const router = express.Router();

const {
    addStore,
    getStores
} = require("../controllers/storeController");


// ADD STORE

router.post(
    "/",
    addStore
);


// GET ALL STORES

router.get(
    "/",
    getStores
);


module.exports = router;