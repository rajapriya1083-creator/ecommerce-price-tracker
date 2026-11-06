const express = require("express");

const {
    getWishlist,
    addToWishlist,
    deleteFromWishlist
} = require("../controllers/wishlistController");

const router = express.Router();


// GET wishlist
router.get("/", getWishlist);


// ADD wishlist
router.post("/", addToWishlist);


// DELETE wishlist
router.delete("/:id", deleteFromWishlist);


module.exports = router;