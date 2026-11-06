const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        website: {
            type: String,
            required: true,
            trim: true
        },

        logo: {
            type: String,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Store =
    mongoose.models.Store ||
    mongoose.model("Store", storeSchema);

module.exports = Store;