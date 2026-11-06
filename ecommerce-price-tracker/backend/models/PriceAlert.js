const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        },

        store: {
            type: String,
            required: true,
            trim: true
        },

        productUrl: {
            type: String,
            default: ""
        },

        image: {
            type: String,
            default: ""
        },

        currentPrice: {
            type: Number,
            required: true,
            min: 0
        },

        targetPrice: {
            type: Number,
            required: true,
            min: 0
        },

        alertReached: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const PriceAlert =
    mongoose.models.PriceAlert ||
    mongoose.model(
        "PriceAlert",
        priceAlertSchema
    );

module.exports = PriceAlert;