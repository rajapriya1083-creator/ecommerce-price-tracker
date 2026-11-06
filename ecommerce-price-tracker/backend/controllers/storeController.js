const Store = require("../models/store");

// ==================== ADD STORE ====================
const addStore = async (req, res) => {
    try {
        const { name, website, logo } = req.body;

        if (!name || !website) {
            return res.status(400).json({
                message: "Store name and website are required"
            });
        }

        const existingStore = await Store.findOne({ name });

        if (existingStore) {
            return res.status(400).json({
                message: "Store already exists"
            });
        }

        const store = new Store({
            name,
            website,
            logo
        });

        await store.save();

        res.status(201).json({
            message: "Store added successfully",
            store
        });

    } catch (error) {
        console.error("Add store error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// ==================== GET ALL STORES ====================
const getStores = async (req, res) => {
    try {
        const stores = await Store.find();

        res.status(200).json(stores);

    } catch (error) {
        console.error("Get stores error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    addStore,
    getStores
};