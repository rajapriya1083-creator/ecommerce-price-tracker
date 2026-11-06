const axios = require("axios");

const Price = require("../models/Price");
const Product = require("../models/Product");
const Store = require("../models/Store");


// =====================================================
// CLEAN PRODUCT NAME
// =====================================================

const cleanProductName = (name = "") => {
    return String(name)
        .replace(/[|]/g, " ")
        .replace(/[,:;()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const escapeRegExp = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const savePriceSnapshots = async (productName, prices) => {
    const product = await Product.findOneAndUpdate(
        {
            name: {
                $regex: `^${escapeRegExp(productName)}$`,
                $options: "i"
            }
        },
        {
            $setOnInsert: {
                name: productName
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );

    for (const item of prices) {
        let website;

        try {
            website = new URL(item.productUrl).origin;
        } catch (error) {
            console.error("Skipping price history record with an invalid product URL:", error.message);
            continue;
        }

        const storeName = String(item.store || "Online Store").trim() || "Online Store";
        const store = await Store.findOneAndUpdate(
            {
                name: {
                    $regex: `^${escapeRegExp(storeName)}$`,
                    $options: "i"
                }
            },
            {
                $setOnInsert: {
                    name: storeName,
                    website
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        await Price.create({
            product: product._id,
            store: store._id,
            price: Number(item.currentPrice),
            productUrl: item.productUrl
        });
    }
};


// =====================================================
// GET PRICE FROM SERPAPI RESULT
// =====================================================

const getPrice = (item) => {
    if (typeof item?.extracted_price === "number") {
        return item.extracted_price;
    }

    if (typeof item?.price === "number") {
        return item.price;
    }

    if (typeof item?.price === "string") {
        const cleaned = item.price
            .replace(/[₹,$,\s]/g, "")
            .replace(/[^\d.]/g, "");

        const number = Number(cleaned);

        return Number.isFinite(number) ? number : 0;
    }

    return 0;
};


// =====================================================
// GET STORE NAME
// =====================================================

const getStoreName = (item) => {
    return (
        item?.source ||
        item?.merchant ||
        item?.store ||
        item?.seller ||
        "Online Store"
    );
};

const normalizeStoreName = (storeName) =>
    String(storeName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const belongsToStore = (resultStore, selectedStore) => {
    const normalizedResult = normalizeStoreName(resultStore);
    const normalizedSelection = normalizeStoreName(selectedStore);
    const storeAliases = {
        amazon: ["amazon", "amazonindia"],
        flipkart: ["flipkart"],
        myntra: ["myntra"],
        ajio: ["ajio"],
        meesho: ["meesho"],
        tatacliq: ["tatacliq", "tata"],
        croma: ["croma"],
        reliancedigital: ["reliancedigital", "reliance"],
        nykaa: ["nykaa"],
        snapdeal: ["snapdeal"],
        jiomart: ["jiomart", "jiomarket"],
    };
    const aliases =
        storeAliases[normalizedSelection] || [normalizedSelection];

    return aliases.some((alias) => normalizedResult.includes(alias));
};


// =====================================================
// GET PRODUCT LINK
// =====================================================

const getProductUrl = (item) => {
    return (
        item?.link ||
        item?.product_link ||
        item?.url ||
        ""
    );
};


// =====================================================
// GET IMAGE
// =====================================================

const getProductImage = (item) => {
    return (
        item?.thumbnail ||
        item?.image ||
        item?.image_link ||
        ""
    );
};


// =====================================================
// NORMALIZE SERPAPI PRODUCT
// =====================================================

const normalizeShoppingResult = (item, searchedName) => {
    return {
        _id:
            item?.product_id ||
            `${getStoreName(item)}-${Date.now()}-${Math.random()}`,

        productName:
            item?.title ||
            searchedName,

        store:
            getStoreName(item),

        currentPrice:
            getPrice(item),

        price:
            getPrice(item),

        productUrl:
            getProductUrl(item),

        image:
            getProductImage(item),

        rating:
            item?.rating || "N/A",

        reviews:
            item?.reviews || 0,

        available:
            true
    };
};


// =====================================================
// REMOVE DUPLICATE PRODUCTS
// Keep the cheapest result from each store
// =====================================================

const removeDuplicateStores = (products) => {
    const storeMap = new Map();

    for (const product of products) {
        const store = String(
            product.store || "Online Store"
        )
            .trim()
            .toLowerCase();

        const existing = storeMap.get(store);

        if (!existing) {
            storeMap.set(store, product);
            continue;
        }

        if (
            (Number(product.currentPrice) > 0 &&
                (Number(existing.currentPrice) <= 0 ||
                    Number(product.currentPrice) < Number(existing.currentPrice)))
        ) {
            storeMap.set(store, product);
        }
    }

    return Array.from(storeMap.values());
};


// =====================================================
// ADD PRICE
// POST /api/prices
// =====================================================

const addPrice = async (req, res) => {
    try {
        const {
            product,
            store,
            price,
            productUrl
        } = req.body;

        if (!product) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

        if (!store) {
            return res.status(400).json({
                message: "Store ID is required"
            });
        }

        if (
            price === undefined ||
            price === null ||
            Number(price) <= 0
        ) {
            return res.status(400).json({
                message: "Valid price is required"
            });
        }

        const productExists =
            await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const existingPrice =
            await Price.findOne({
                product,
                store
            });

        if (existingPrice) {
            existingPrice.price = Number(price);
            existingPrice.productUrl = productUrl || "";

            await existingPrice.save();

            const updatedPrice =
                await Price.findById(existingPrice._id)
                    .populate("product")
                    .populate("store");

            return res.status(200).json({
                message: "Price updated successfully",
                price: updatedPrice
            });
        }

        const newPrice =
            await Price.create({
                product,
                store,
                price: Number(price),
                productUrl: productUrl || ""
            });

        const populatedPrice =
            await Price.findById(newPrice._id)
                .populate("product")
                .populate("store");

        return res.status(201).json({
            message: "Price added successfully",
            price: populatedPrice
        });

    } catch (error) {
        console.error("Add price error:", error);

        return res.status(500).json({
            message: "Failed to add price",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL PRICES
// =====================================================

const getAllPrices = async (req, res) => {
    try {
        const prices =
            await Price.find()
                .populate("product")
                .populate("store")
                .sort({ price: 1 });

        return res.status(200).json(prices);

    } catch (error) {
        console.error("Get all prices error:", error);

        return res.status(500).json({
            message: "Failed to fetch prices",
            error: error.message
        });
    }
};


// =====================================================
// SEARCH LIVE SHOPPING PRICES
//
// GET:
// /api/prices/search?productName=iPhone%2015
// =====================================================

const searchPrices = async (req, res) => {
    try {
        const productName =
            cleanProductName(
                req.query.productName || ""
            );

        console.log(
            "================================="
        );

        console.log(
            "LIVE PRICE SEARCH:"
        );

        console.log(
            "PRODUCT:",
            productName
        );

        console.log(
            "================================="
        );


        // ---------------------------------------------
        // Validate search
        // ---------------------------------------------

        if (!productName) {
            return res.status(400).json({
                message: "Please enter a product name",
                prices: []
            });
        }


        // ---------------------------------------------
        // Check API key
        // ---------------------------------------------

        if (!process.env.SERPAPI_KEY) {
            return res.status(500).json({
                message:
                    "SERPAPI_KEY is missing in .env file",
                prices: []
            });
        }


        // ---------------------------------------------
        // SEARCH GOOGLE SHOPPING THROUGH SERPAPI
        // ---------------------------------------------

        console.log(
            "Searching Google Shopping..."
        );


        const selectedStores =
            typeof req.query.stores === "string"
                ? Array.from(new Set(
                    req.query.stores
                        .split(",")
                        .map((store) => store.trim())
                        .filter(Boolean)
                ))
                : [];
        const storeQueries = selectedStores.length > 0
            ? [
                { store: null, query: productName },
                ...selectedStores.map((store) => ({
                    store,
                    query: `${productName} ${store}`
                }))
            ]
            : [{ store: null, query: productName }];
        const searchResults = await Promise.allSettled(
            storeQueries.map(({ query }) =>
                axios.get(
                    "https://serpapi.com/search.json",
                    {
                        params: {
                            engine: "google_shopping",
                            q: query,
                            api_key: process.env.SERPAPI_KEY,
                            location: "India",
                            gl: "in",
                            hl: "en",
                            num: 100
                        },
                        timeout: 30000
                    }
                )
            )
        );
        const successfulResults = searchResults.filter(
            (result) => result.status === "fulfilled"
        );
        const storeSearchFailures = searchResults.flatMap((result, index) =>
            result.status === "rejected" && storeQueries[index].store
                ? [storeQueries[index].store]
                : []
        );

        if (successfulResults.length === 0) {
            const failedSearch = searchResults.find(
                (result) => result.status === "rejected"
            );
            throw failedSearch.reason;
        }

        const shoppingResults = successfulResults.flatMap((result) =>
            result.value.data?.shopping_results || []
        );


        console.log(
            "SHOPPING RESULTS:",
            shoppingResults.length
        );


        // ---------------------------------------------
        // NORMALIZE RESULTS
        // ---------------------------------------------

        let prices =
            shoppingResults
                .map((item) =>
                    normalizeShoppingResult(
                        item,
                        productName
                    )
                )
                .filter(
                    (item) =>
                        (
                            selectedStores.length === 0 ||
                            selectedStores.some((store) =>
                                belongsToStore(item.store, store)
                            )
                        ) &&
                        (
                            selectedStores.length > 0 ||
                            (item.currentPrice > 0 && item.productUrl)
                        )
                );


        console.log(
            "VALID PRICE RESULTS:",
            prices.length
        );


        // ---------------------------------------------
        // REMOVE DUPLICATE STORES
        // ---------------------------------------------

        prices =
            removeDuplicateStores(
                prices
            );


        // ---------------------------------------------
        // SORT LOWEST PRICE FIRST
        // ---------------------------------------------

        prices.sort(
            (a, b) =>
                Number(a.currentPrice) -
                Number(b.currentPrice)
        );


        // ---------------------------------------------
        // NO RESULTS
        // ---------------------------------------------

        if (prices.length === 0 && selectedStores.length === 0) {
            return res.status(404).json({
                message:
                    `No shopping prices found for "${productName}".`,
                productName,
                prices: []
            });
        }

        let historySaved = true;
        let historyWarning = "";

        const pricesWithKnownValues = prices.filter(
            (item) => item.currentPrice > 0 && item.productUrl
        );

        if (pricesWithKnownValues.length > 0) {
            try {
                await savePriceSnapshots(productName, pricesWithKnownValues);
            } catch (historyError) {
                historySaved = false;
                historyWarning = "Current prices were found, but could not be saved to price history.";
                console.error("Failed to save price history snapshots:", historyError);
            }
        }


        // ---------------------------------------------
        // BEST PRICE
        // ---------------------------------------------

        const bestPrice = prices[0] || null;


        console.log(
            "================================="
        );

        console.log(
            "FINAL PRICE COMPARISON:"
        );

        console.log(
            prices.map((item) => ({
                store:
                    item.store,

                product:
                    item.productName,

                price:
                    item.currentPrice
            }))
        );

        console.log(
            "BEST PRICE:",
            bestPrice?.store || "No offer found",
            bestPrice?.currentPrice || "N/A"
        );

        console.log(
            "TOTAL STORES:",
            prices.length
        );

        console.log(
            "================================="
        );


        // ---------------------------------------------
        // SEND RESULTS TO FRONTEND
        // ---------------------------------------------

        return res.status(200).json({

            message:
                "Prices found successfully",

            productName:

                productName,

            source:

                "google-shopping",

            historySaved,

            ...(historyWarning ? { historyWarning } : {}),

            ...(storeSearchFailures.length > 0
                ? { storeSearchFailures }
                : {}),

            bestPrice:

                bestPrice,

            prices:

                prices
        });


    } catch (error) {

        console.error(
            "LIVE PRICE SEARCH ERROR:"
        );

        console.error(
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            message:
                "Failed to search product prices",

            error:
                error.response?.data?.error ||
                error.message,

            prices:
                []
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    addPrice,

    getAllPrices,

    searchPrices

};