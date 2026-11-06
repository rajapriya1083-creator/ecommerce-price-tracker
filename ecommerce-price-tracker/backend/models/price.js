const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        productUrl: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Price =
    mongoose.models.Price ||
    mongoose.model("Price", priceSchema);

module.exports = Price;