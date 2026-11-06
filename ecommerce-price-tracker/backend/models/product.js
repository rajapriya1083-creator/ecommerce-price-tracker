const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        brand: {
            type: String,
            default: "",
            trim: true
        },

        category: {
            type: String,
            default: "",
            trim: true
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Product =
    mongoose.models.Product ||
    mongoose.model("Product", productSchema);

module.exports = Product;