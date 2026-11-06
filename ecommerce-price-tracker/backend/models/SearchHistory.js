const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const SearchHistory =
    mongoose.models.SearchHistory ||
    mongoose.model(
        "SearchHistory",
        searchHistorySchema
    );

module.exports = SearchHistory;