const Wishlist = require("../models/Wishlist");

// ==========================================
// GET WISHLIST
// ==========================================

const getWishlist = async (req, res) => {
    try {

        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        const wishlist = await Wishlist.find({
            userId: userId
        }).sort({
            createdAt: -1
        });

        res.status(200).json(wishlist);

    } catch (error) {

        console.error(
            "Get wishlist error:",
            error
        );

        res.status(500).json({
            message: "Unable to load wishlist"
        });
    }
};


// ==========================================
// ADD TO WISHLIST
// ==========================================

const addToWishlist = async (req, res) => {
    try {

        const {
            userId,
            productName,
            store,
            price,
            image,
            productUrl
        } = req.body;

        if (!userId || !productName) {
            return res.status(400).json({
                message:
                    "User ID and product name are required"
            });
        }

        // Check duplicate
        const existingProduct =
            await Wishlist.findOne({
                userId: userId,
                productName: productName,
                store: store || ""
            });

        if (existingProduct) {
            return res.status(400).json({
                message:
                    "Product already exists in wishlist"
            });
        }

        const wishlistItem =
            await Wishlist.create({
                userId,
                productName,
                store: store || "",
                price: Number(price) || 0,
                image: image || "",
                productUrl: productUrl || ""
            });

        res.status(201).json({
            message:
                "Product added to wishlist",
            wishlistItem
        });

    } catch (error) {

        console.error(
            "Add wishlist error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to add product to wishlist"
        });
    }
};


// ==========================================
// DELETE FROM WISHLIST
// ==========================================

const deleteFromWishlist = async (req, res) => {
    try {

        const { id } = req.params;

        const deleted =
            await Wishlist.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                message:
                    "Wishlist product not found"
            });
        }

        res.status(200).json({
            message:
                "Product removed from wishlist"
        });

    } catch (error) {

        console.error(
            "Delete wishlist error:",
            error
        );

        res.status(500).json({
            message:
                "Unable to remove product"
        });
    }
};


module.exports = {
    getWishlist,
    addToWishlist,
    deleteFromWishlist
};