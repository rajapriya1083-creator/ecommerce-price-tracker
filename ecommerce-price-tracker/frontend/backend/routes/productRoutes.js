const express = require("express");

const router = express.Router();
const { getProducts } = require("../controllers/productController");

router.get("/", getProducts);


// =====================================================
// QUICKCOMMERCE SETTINGS
// =====================================================

const API_BASE_URL =
    "https://api.quickcommerceapi.com";


// =====================================================
// PLATFORMS
//
// These are the platforms currently supported by
// QuickCommerce API for product search.
//
// The first group does not require a pincode.
// DMart, JioMart and Minutes are handled separately
// because they require a pincode.
// =====================================================

const GENERAL_PLATFORMS = [
    "BlinkIt",
    "Zepto",
    "Swiggy",
    "BigBasket",
    "Amazon",
    "Nykaa",
    "Myntra",
    "Flipkart"
];


const PINCODE_PLATFORMS = [
    "DMart",
    "JioMart",
    "Minutes"
];


// =====================================================
// HELPER
// GET PRODUCT PRICE
// =====================================================

const getProductPrice = (product) => {

    const price =
        product?.offer_price ??
        product?.offerPrice ??
        product?.currentPrice ??
        product?.price ??
        product?.sellingPrice ??
        product?.amount ??
        0;


    const numberPrice = Number(
        String(price)
            .replace(/[₹,\s]/g, "")
    );


    return Number.isFinite(numberPrice)
        ? numberPrice
        : 0;

};


// =====================================================
// HELPER
// GET PLATFORM NAME
// =====================================================

const getPlatformName = (
    product,
    fallbackPlatform = "Online Store"
) => {

    if (
        typeof product?.platform === "string"
    ) {

        return product.platform;

    }


    if (
        product?.platform?.name
    ) {

        return product.platform.name;

    }


    if (
        product?.platform?.title
    ) {

        return product.platform.title;

    }


    if (
        typeof product?.store === "string"
    ) {

        return product.store;

    }


    if (
        product?.store?.name
    ) {

        return product.store.name;

    }


    return fallbackPlatform;

};


// =====================================================
// HELPER
// GET PRODUCT URL
// =====================================================

const getProductUrl = (
    product
) => {

    return (
        product?.deeplink ||
        product?.productUrl ||
        product?.url ||
        product?.link ||
        product?.storeUrl ||
        ""
    );

};


// =====================================================
// HELPER
// GET PRODUCT IMAGE
// =====================================================

const getProductImage = (
    product
) => {

    if (
        Array.isArray(product?.images) &&
        product.images.length > 0
    ) {

        return product.images[0];

    }


    return (
        product?.image ||
        product?.imageUrl ||
        ""
    );

};


// =====================================================
// NORMALIZE PRODUCT
// =====================================================

const normalizeProduct = (
    product,
    platform,
    searchedName
) => {

    const price =
        getProductPrice(product);


    return {

        id:
            product?.id ||
            product?._id ||
            `${platform}-${Date.now()}-${Math.random()}`,

        _id:
            product?._id ||
            product?.id ||
            `${platform}-${Date.now()}-${Math.random()}`,

        name:
            product?.name ||
            product?.title ||
            product?.productName ||
            searchedName,

        title:
            product?.title ||
            product?.name ||
            searchedName,

        productName:
            product?.name ||
            product?.title ||
            product?.productName ||
            searchedName,

        brand:
            product?.brand ||
            "",

        images:
            Array.isArray(product?.images)
                ? product.images
                : product?.image
                    ? [product.image]
                    : [],

        image:
            getProductImage(product),

        offer_price:
            price,

        offerPrice:
            price,

        price:
            price,

        currentPrice:
            price,

        mrp:
            Number(
                product?.mrp ||
                0
            ),

        available:
            product?.available ??
            product?.in_stock ??
            true,

        rating:
            product?.rating ??
            "N/A",

        productUrl:
            getProductUrl(product),

        deeplink:
            getProductUrl(product),

        url:
            getProductUrl(product),

        platform: {

            name:
                getPlatformName(
                    product,
                    platform
                )

        },

        store:
            getPlatformName(
                product,
                platform
            )

    };

};


// =====================================================
// EXTRACT PRODUCTS FROM GROUP SEARCH RESPONSE
// =====================================================

const extractGroupProducts = (
    data,
    searchedName
) => {

    const output = [];


    // =================================================
    // FORMAT 1
    //
    // data.results = {
    //     Amazon: [...],
    //     Flipkart: [...]
    // }
    // =================================================

    if (
        data?.data?.results &&
        typeof data.data.results === "object" &&
        !Array.isArray(data.data.results)
    ) {

        for (
            const [
                platform,
                products
            ]
            of Object.entries(
                data.data.results
            )
        ) {

            if (
                Array.isArray(products)
            ) {

                products.forEach(
                    product => {

                        output.push(
                            normalizeProduct(
                                product,
                                platform,
                                searchedName
                            )
                        );

                    }
                );

            }

        }

    }


    // =================================================
    // FORMAT 2
    //
    // data.platforms = {
    //     Amazon: {
    //         products: [...]
    //     }
    // }
    // =================================================

    if (
        data?.data?.platforms &&
        typeof data.data.platforms === "object"
    ) {

        for (
            const [
                platform,
                platformData
            ]
            of Object.entries(
                data.data.platforms
            )
        ) {

            let products = [];


            if (
                Array.isArray(
                    platformData
                )
            ) {

                products =
                    platformData;

            }

            else if (
                Array.isArray(
                    platformData?.products
                )
            ) {

                products =
                    platformData.products;

            }

            else if (
                Array.isArray(
                    platformData?.results
                )
            ) {

                products =
                    platformData.results;

            }


            products.forEach(
                product => {

                    output.push(
                        normalizeProduct(
                            product,
                            platform,
                            searchedName
                        )
                    );

                }
            );

        }

    }


    // =================================================
    // FORMAT 3
    //
    // data.data.groups
    // =================================================

    if (
        Array.isArray(
            data?.data?.groups
        )
    ) {

        data.data.groups.forEach(
            group => {

                const products =
                    Array.isArray(
                        group?.data
                    )
                        ? group.data
                        : Array.isArray(
                            group?.products
                        )
                            ? group.products
                            : [];


                products.forEach(
                    product => {

                        const platform =
                            getPlatformName(
                                product,
                                "Online Store"
                            );


                        output.push(
                            normalizeProduct(
                                product,
                                platform,
                                searchedName
                            )
                        );

                    }
                );

            }
        );

    }


    return output;

};


// =====================================================
// CALL GROUP SEARCH
// =====================================================

const searchPlatforms = async (
    query,
    platforms,
    pincode = ""
) => {

    if (
        !Array.isArray(platforms) ||
        platforms.length === 0
    ) {

        return [];

    }


    const url =
        `${API_BASE_URL}/v1/groupsearch` +
        `?q=${encodeURIComponent(query)}` +
        `&lat=12.9716` +
        `&lon=77.5946` +
        `&platforms=${encodeURIComponent(
            platforms.join(",")
        )}`;


    const finalUrl =
        pincode
            ? `${url}&pincode=${encodeURIComponent(
                pincode
            )}`
            : url;


    console.log(
        "=========================================="
    );

    console.log(
        "QUICKCOMMERCE GROUP SEARCH"
    );

    console.log(
        "QUERY:",
        query
    );

    console.log(
        "PLATFORMS:",
        platforms.join(", ")
    );

    console.log(
        "=========================================="
    );


    const response =
        await fetch(
            finalUrl,
            {

                method: "GET",

                headers: {

                    "X-API-Key":
                        process.env.QUICKCOMMERCE_API_KEY,

                    "Accept":
                        "application/json"

                }

            }
        );


    const responseText =
        await response.text();


    console.log(
        "GROUP SEARCH STATUS:",
        response.status
    );


    let data;


    try {

        data =
            JSON.parse(
                responseText
            );

    }

    catch {

        console.error(
            "QuickCommerce returned non-JSON:",
            responseText
        );

        return [];

    }


    if (
        !response.ok
    ) {

        console.error(
            "QuickCommerce group search error:",
            data
        );

        return [];

    }


    const products =
        extractGroupProducts(
            data,
            query
        );


    console.log(
        "GROUP PRODUCTS FOUND:",
        products.length
    );


    return products;

};


// =====================================================
// LIVE PRODUCT SEARCH
//
// GET /api/external-products/search?q=iphone
// =====================================================

router.get(
    "/search",
    async (req, res) => {

        try {

            const query =
                req.query.q?.trim() ||
                "";


            // =============================================
            // VALIDATE
            // =============================================

            if (!query) {

                return res.status(400).json({

                    message:
                        "Please enter a product name",

                    products: []

                });

            }


            // =============================================
            // API KEY
            // =============================================

            if (
                !process.env.QUICKCOMMERCE_API_KEY
            ) {

                return res.status(500).json({

                    message:
                        "QUICKCOMMERCE_API_KEY is missing from .env",

                    products: []

                });

            }


            // =============================================
            // GENERAL PLATFORMS
            // =============================================

            let products =
                await searchPlatforms(
                    query,
                    GENERAL_PLATFORMS
                );


            // =============================================
            // OPTIONAL PINCODE PLATFORMS
            //
            // These platforms require a pincode.
            // If QUICKCOMMERCE_PINCODE exists in .env,
            // search them too.
            // =============================================

            const pincode =
                process.env.QUICKCOMMERCE_PINCODE ||
                "";


            if (pincode) {

                const pincodeProducts =
                    await searchPlatforms(
                        query,
                        PINCODE_PLATFORMS,
                        pincode
                    );


                products = [
                    ...products,
                    ...pincodeProducts
                ];

            }


            // =============================================
            // KEEP ONLY PRODUCTS WITH VALID PRICE
            // =============================================

            products =
                products.filter(
                    product =>
                        Number(
                            product.currentPrice ||
                            product.price ||
                            0
                        ) > 0
                );


            // =============================================
            // REMOVE DUPLICATE STORE/PRODUCT RESULTS
            //
            // Keep the first result from each store.
            // =============================================

            const storeMap =
                new Map();


            for (
                const product
                of products
            ) {

                const storeName =
                    typeof product.store === "string"
                        ? product.store
                        : product.platform?.name ||
                          "Online Store";


                const key =
                    storeName
                        .trim()
                        .toLowerCase();


                if (
                    !storeMap.has(key)
                ) {

                    storeMap.set(
                        key,
                        product
                    );

                }

            }


            const uniqueProducts =
                Array.from(
                    storeMap.values()
                );


            console.log(
                "UNIQUE LIVE STORES:",
                uniqueProducts.map(
                    product =>
                        product.store
                )
            );


            // =============================================
            // NO RESULTS
            // =============================================

            if (
                uniqueProducts.length === 0
            ) {

                return res.status(200).json({

                    message:
                        `No live products found for "${query}".`,

                    query:

                        query,

                    products: []

                });

            }


            // =============================================
            // RETURN LIVE PRODUCTS
            // =============================================

            return res.status(200).json({

                message:
                    "Live products found successfully",

                query:
                    query,

                products:
                    uniqueProducts

            });

        }

        catch (error) {

            console.error(
                "Live product search error:",
                error
            );


            return res.status(500).json({

                message:
                    "Unable to search live products",

                error:
                    error.message,

                products: []

            });

        }

    }
);


// =====================================================
// TEST ENDPOINT
//
// GET /api/external-products/test?q=iphone
// =====================================================

router.get(
    "/test",
    async (req, res) => {

        try {

            const query =
                req.query.q?.trim() ||
                "wireless earbuds";


            if (
                !process.env.QUICKCOMMERCE_API_KEY
            ) {

                return res.status(500).json({

                    message:
                        "QUICKCOMMERCE_API_KEY is missing from .env"

                });

            }


            const products =
                await searchPlatforms(
                    query,
                    [
                        "Amazon"
                    ]
                );


            return res.status(200).json({

                message:
                    "Live product API is working",

                query:
                    query,

                products:
                    products

            });

        }

        catch (error) {

            console.error(
                "QuickCommerce test error:",
                error
            );


            return res.status(500).json({

                message:
                    "Unable to connect to QuickCommerce API",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;