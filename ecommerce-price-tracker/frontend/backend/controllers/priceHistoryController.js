const Price = require("../models/Price");


// ==========================================
// GET PRICE HISTORY
// ==========================================

const getPriceHistory = async (req, res) => {

    try {

        const productName =
            req.params.productName;

        if (!productName) {

            return res.status(400).json({
                message: "Product name is required"
            });

        }


        // Get all prices from the database
        const prices = await Price.find()
            .populate("product")
            .populate("store")
            .sort({
                createdAt: 1
            });


        // Filter prices for the requested product
        const history = prices.filter((item) => {

            const name =
                item.product?.name ||
                "";

            return (
                name.toLowerCase() ===
                productName.toLowerCase()
            );

        });


        return res.status(200).json({

            productName: productName,

            history: history

        });

    } catch (error) {

        console.error(
            "Price history error:",
            error
        );

        return res.status(500).json({

            message:
                "Failed to fetch price history",

            error:
                error.message

        });

    }

};


module.exports = {
    getPriceHistory
};