const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        store: {
            type: String,
            default: "",
            trim: true
        },

        price: {
            type: Number,
            default: 0
        },

        image: {
            type: String,
            default: ""
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

module.exports =
    mongoose.models.Wishlist ||
    mongoose.model("Wishlist", wishlistSchema);