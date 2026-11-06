const express = require("express");

const router = express.Router();


// =====================================================
// QUICKCOMMERCE SETTINGS
// =====================================================

// Platforms currently supported by QuickCommerce API
const LIVE_PLATFORMS = [
    "Amazon",
    "Flipkart",
    "BlinkIt",
    "Zepto",
    "Swiggy",
    "BigBasket",
    "DMart",
    "JioMart",
    "Minutes",
    "Nykaa",
    "Myntra"
];


// =====================================================
// DEFAULT LOCATION
// =====================================================

const DEFAULT_LAT =
    process.env.QUICKCOMMERCE_LAT || "12.9716";

const DEFAULT_LON =
    process.env.QUICKCOMMERCE_LON || "77.5946";

const DEFAULT_PINCODE =
    process.env.QUICKCOMMERCE_PINCODE || "";


// =====================================================
// NORMALIZE PRODUCT
// =====================================================

const normalizeProduct = (
    product,
    index,
    requestedPlatform = ""
) => {

    // ---------------------------------------------
    // PRODUCT NAME
    // ---------------------------------------------

    const name =
        product.name ||
        product.title ||
        product.product_name ||
        product.productName ||
        "Product";


    // ---------------------------------------------
    // BRAND
    // ---------------------------------------------

    const brand =
        product.brand ||
        product.brand_name ||
        product.brandName ||
        "";


    // ---------------------------------------------
    // IMAGES
    // ---------------------------------------------

    let images = [];


    if (
        Array.isArray(
            product.images
        )
    ) {

        images =
            product.images;

    }

    else if (
        Array.isArray(
            product.image_urls
        )
    ) {

        images =
            product.image_urls;

    }

    else if (
        product.image
    ) {

        images = [
            product.image
        ];

    }

    else if (
        product.image_url
    ) {

        images = [
            product.image_url
        ];

    }


    // ---------------------------------------------
    // OFFER PRICE
    // ---------------------------------------------

    const offerPrice =
        product.offer_price ??
        product.offerPrice ??
        product.sale_price ??
        product.salePrice ??
        product.discount_price ??
        product.discountPrice ??
        product.price ??
        0;


    // ---------------------------------------------
    // PRICE
    // ---------------------------------------------

    const price =
        product.price ??
        product.offer_price ??
        product.offerPrice ??
        offerPrice ??
        0;


    // ---------------------------------------------
    // MRP
    // ---------------------------------------------

    const mrp =
        product.mrp ??
        product.MRP ??
        product.original_price ??
        product.originalPrice ??
        0;


    // ---------------------------------------------
    // AVAILABILITY
    // ---------------------------------------------

    const available =
        product.available ??
        product.in_stock ??
        product.inStock ??
        product.is_available ??
        product.isAvailable ??
        true;


    // ---------------------------------------------
    // RATING
    // ---------------------------------------------

    const rating =
        product.rating ??
        product.ratings ??
        product.average_rating ??
        product.averageRating ??
        "N/A";


    // ---------------------------------------------
    // PRODUCT URL
    // ---------------------------------------------

    const deeplink =
        product.deeplink ||
        product.deep_link ||
        product.url ||
        product.product_url ||
        product.productUrl ||
        product.link ||
        "";


    // ---------------------------------------------
    // PLATFORM
    // ---------------------------------------------

    let platform =
        product.platform ||
        product.store ||
        product.merchant ||
        null;


    if (
        typeof platform === "string"
    ) {

        platform = {
            name: platform
        };

    }


    if (
        !platform ||
        typeof platform !== "object"
    ) {

        platform = {
            name:
                requestedPlatform ||
                "Unknown"
        };

    }


    // ---------------------------------------------
    // RETURN NORMALIZED PRODUCT
    // ---------------------------------------------

    return {

        id:
            product.id ||
            product._id ||
            product.product_id ||
            product.productId ||
            `${requestedPlatform || "external"}-${index}`,

        name,

        brand,

        images,

        offer_price:
            Number(
                offerPrice
            ) || 0,

        price:
            Number(
                price
            ) || 0,

        mrp:
            Number(
                mrp
            ) || 0,

        available:
            Boolean(
                available
            ),

        rating,

        deeplink,

        platform

    };

};


// =====================================================
// EXTRACT PRODUCTS FROM RESPONSE
// =====================================================

const extractProducts = (data) => {

    // ---------------------------------------------
    // NORMAL SINGLE PLATFORM RESPONSE
    // ---------------------------------------------

    if (
        data?.data?.products &&
        Array.isArray(
            data.data.products
        )
    ) {

        return data.data.products;

    }


    // ---------------------------------------------
    // products
    // ---------------------------------------------

    if (
        Array.isArray(
            data?.products
        )
    ) {

        return data.products;

    }


    // ---------------------------------------------
    // results
    // ---------------------------------------------

    if (
        data?.data?.results &&
        Array.isArray(
            data.data.results
        )
    ) {

        return data.data.results;

    }


    if (
        Array.isArray(
            data?.results
        )
    ) {

        return data.results;

    }


    // ---------------------------------------------
    // data array
    // ---------------------------------------------

    if (
        Array.isArray(
            data?.data
        )
    ) {

        return data.data;

    }


    // ---------------------------------------------
    // items
    // ---------------------------------------------

    if (
        data?.data?.items &&
        Array.isArray(
            data.data.items
        )
    ) {

        return data.data.items;

    }


    if (
        Array.isArray(
            data?.items
        )
    ) {

        return data.items;

    }


    return [];

};


// =====================================================
// LIVE MULTI-PLATFORM PRODUCT SEARCH
//
// GET /api/external-products/search?q=iphone
// =====================================================

router.get(
    "/search",
    async (req, res) => {

        try {

            const query =
                req.query.q?.trim() || "";


            // =========================================
            // VALIDATE SEARCH
            // =========================================

            if (!query) {

                return res.status(400).json({

                    message:
                        "Please enter a product name",

                    products: []

                });

            }


            // =========================================
            // CHECK API KEY
            // =========================================

            if (
                !process.env.QUICKCOMMERCE_API_KEY
            ) {

                return res.status(500).json({

                    message:
                        "QUICKCOMMERCE_API_KEY is missing from .env",

                    products: []

                });

            }


            // =========================================
            // LOCATION
            // =========================================

            const lat =
                req.query.lat ||
                DEFAULT_LAT;

            const lon =
                req.query.lon ||
                DEFAULT_LON;

            const pincode =
                req.query.pincode ||
                DEFAULT_PINCODE;


            // =========================================
            // PLATFORMS
            // =========================================

            const platforms =
                LIVE_PLATFORMS.join(",");


            // =========================================
            // GROUP SEARCH URL
            // =========================================

            const apiUrl =
                "https://api.quickcommerceapi.com/v1/groupsearch" +
                `?q=${encodeURIComponent(query)}` +
                `&lat=${encodeURIComponent(lat)}` +
                `&lon=${encodeURIComponent(lon)}` +
                `&platforms=${encodeURIComponent(platforms)}`;


            // =========================================
            // PINCODE
            // =========================================

            const finalUrl =
                pincode
                    ? apiUrl +
                      `&pincode=${encodeURIComponent(pincode)}`
                    : apiUrl;


            console.log(
                "=========================================="
            );

            console.log(
                "LIVE MULTI-PLATFORM PRODUCT SEARCH"
            );

            console.log(
                "SEARCH:",
                query
            );

            console.log(
                "LAT:",
                lat
            );

            console.log(
                "LON:",
                lon
            );

            console.log(
                "PINCODE:",
                pincode || "Not supplied"
            );

            console.log(
                "PLATFORMS:",
                LIVE_PLATFORMS.join(", ")
            );

            console.log(
                "=========================================="
            );


            // =========================================
            // CALL QUICKCOMMERCE GROUP SEARCH
            // =========================================

            const response =
                await fetch(
                    finalUrl,
                    {

                        method: "GET",

                        headers: {

                            "X-API-Key":
                                process.env
                                    .QUICKCOMMERCE_API_KEY,

                            "Accept":
                                "application/json"

                        }

                    }
                );


            // =========================================
            // READ RESPONSE
            // =========================================

            const responseText =
                await response.text();


            console.log(
                "External API status:",
                response.status
            );


            // =========================================
            // PARSE JSON
            // =========================================

            let data;

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                console.error(
                    "External API returned invalid JSON:"
                );

                console.error(
                    responseText
                );

                return res.status(502).json({

                    message:
                        "External product API did not return valid JSON",

                    products: []

                });

            }


            // =========================================
            // API ERROR
            // =========================================

            if (
                !response.ok
            ) {

                console.error(
                    "External API error:",
                    data
                );

                return res.status(
                    response.status
                ).json({

                    message:
                        data?.message ||
                        "External product API request failed",

                    products: []

                });

            }


            // =========================================
            // GROUP SEARCH RESPONSE
            // =========================================

            let allProducts = [];


            // -----------------------------------------
            // FORMAT 1
            // data.results
            // -----------------------------------------

            if (
                Array.isArray(
                    data?.data?.results
                )
            ) {

                allProducts =
                    data.data.results;

            }


            // -----------------------------------------
            // FORMAT 2
            // data.products
            // -----------------------------------------

            else if (
                Array.isArray(
                    data?.data?.products
                )
            ) {

                allProducts =
                    data.data.products;

            }


            // -----------------------------------------
            // FORMAT 3
            // data array
            // -----------------------------------------

            else if (
                Array.isArray(
                    data?.data
                )
            ) {

                allProducts =
                    data.data;

            }


            // -----------------------------------------
            // FORMAT 4
            // products
            // -----------------------------------------

            else if (
                Array.isArray(
                    data?.products
                )
            ) {

                allProducts =
                    data.products;

            }


            // =========================================
            // GROUPED PLATFORM RESPONSE
            // =========================================

            if (
                data?.data &&
                typeof data.data === "object" &&
                !Array.isArray(data.data)
            ) {

                const possibleGroups =
                    Object.entries(
                        data.data
                    );


                for (
                    const [
                        platformName,
                        platformData
                    ]
                    of possibleGroups
                ) {

                    if (
                        Array.isArray(
                            platformData
                        )
                    ) {

                        allProducts.push(
                            ...platformData.map(
                                product => ({

                                    ...product,

                                    platform:
                                        product.platform ||
                                        {
                                            name:
                                                platformName
                                        }

                                })
                            )
                        );

                    }


                    else if (
                        platformData &&
                        Array.isArray(
                            platformData.products
                        )
                    ) {

                        allProducts.push(
                            ...platformData.products.map(
                                product => ({

                                    ...product,

                                    platform:
                                        product.platform ||
                                        {
                                            name:
                                                platformName
                                        }

                                })
                            )
                        );

                    }

                }

            }


            // =========================================
            // NORMALIZE PRODUCTS
            // =========================================

            const normalizedProducts =
                allProducts.map(
                    (product, index) => {

                        let platformName = "";


                        if (
                            typeof product?.platform ===
                            "string"
                        ) {

                            platformName =
                                product.platform;

                        }

                        else if (
                            product?.platform?.name
                        ) {

                            platformName =
                                product.platform.name;

                        }

                        else if (
                            product?.store
                        ) {

                            if (
                                typeof product.store ===
                                "string"
                            ) {

                                platformName =
                                    product.store;

                            }

                            else {

                                platformName =
                                    product.store?.name ||
                                    "";

                            }

                        }


                        return normalizeProduct(
                            product,
                            index,
                            platformName
                        );

                    }
                );


            // =========================================
            // REMOVE INVALID PRODUCTS
            // =========================================

            const validProducts =
                normalizedProducts.filter(
                    product =>
                        product &&
                        product.name &&
                        (
                            Number(
                                product.offer_price
                            ) > 0 ||

                            Number(
                                product.price
                            ) > 0
                        )
                );


            // =========================================
            // REMOVE DUPLICATES
            // =========================================

            const uniqueProducts = [];

            const seen = new Set();


            for (
                const product
                of validProducts
            ) {

                const platformName =
                    product?.platform?.name ||
                    "Unknown";

                const key =
                    `${platformName}::${product.name}::${product.offer_price || product.price}`;


                if (
                    !seen.has(key)
                ) {

                    seen.add(key);

                    uniqueProducts.push(
                        product
                    );

                }

            }


            // =========================================
            // LOG PLATFORM COUNTS
            // =========================================

            const platformCounts = {};


            uniqueProducts.forEach(
                product => {

                    const name =
                        product?.platform?.name ||
                        "Unknown";

                    platformCounts[name] =
                        (
                            platformCounts[name] ||
                            0
                        ) + 1;

                }
            );


            console.log(
                "PRODUCTS FOUND:",
                uniqueProducts.length
            );

            console.log(
                "PLATFORM COUNTS:",
                platformCounts
            );


            // =========================================
            // NO PRODUCTS
            // =========================================

            if (
                uniqueProducts.length === 0
            ) {

                console.log(
                    "FULL API RESPONSE:"
                );

                console.log(
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                );

                return res.status(200).json({

                    message:
                        `No live products found for "${query}".`,

                    query,

                    products: []

                });

            }


            // =========================================
            // RETURN LIVE PRODUCTS
            // =========================================

            return res.status(200).json({

                message:
                    "Live products found successfully",

                query,

                platforms:
                    Object.keys(
                        platformCounts
                    ),

                platformCounts,

                products:
                    uniqueProducts

            });


        } catch (error) {

            console.error(
                "=========================================="
            );

            console.error(
                "LIVE MULTI-PLATFORM SEARCH ERROR"
            );

            console.error(
                error
            );

            console.error(
                "=========================================="
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


            // =========================================
            // CHECK API KEY
            // =========================================

            if (
                !process.env.QUICKCOMMERCE_API_KEY
            ) {

                return res.status(500).json({

                    message:
                        "QUICKCOMMERCE_API_KEY is missing from .env"

                });

            }


            const lat =
                req.query.lat ||
                DEFAULT_LAT;

            const lon =
                req.query.lon ||
                DEFAULT_LON;

            const pincode =
                req.query.pincode ||
                DEFAULT_PINCODE;


            // =========================================
            // MULTI PLATFORM URL
            // =========================================

            const platforms =
                LIVE_PLATFORMS.join(",");


            let apiUrl =
                "https://api.quickcommerceapi.com/v1/groupsearch" +
                `?q=${encodeURIComponent(query)}` +
                `&lat=${encodeURIComponent(lat)}` +
                `&lon=${encodeURIComponent(lon)}` +
                `&platforms=${encodeURIComponent(platforms)}`;


            if (pincode) {

                apiUrl +=
                    `&pincode=${encodeURIComponent(pincode)}`;

            }


            // =========================================
            // CALL API
            // =========================================

            const response =
                await fetch(
                    apiUrl,
                    {

                        method: "GET",

                        headers: {

                            "X-API-Key":
                                process.env
                                    .QUICKCOMMERCE_API_KEY,

                            "Accept":
                                "application/json"

                        }

                    }
                );


            const responseText =
                await response.text();


            // =========================================
            // PARSE JSON
            // =========================================

            let data;

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch {

                return res.status(502).json({

                    message:
                        "QuickCommerce API did not return JSON",

                    status:
                        response.status,

                    response:
                        responseText

                });

            }


            // =========================================
            // API ERROR
            // =========================================

            if (
                !response.ok
            ) {

                return res.status(
                    response.status
                ).json({

                    message:
                        "QuickCommerce API request failed",

                    data

                });

            }


            // =========================================
            // SUCCESS
            // =========================================

            return res.status(200).json({

                message:
                    "Live multi-platform API is working",

                query,

                platforms:
                    LIVE_PLATFORMS,

                data

            });


        } catch (error) {

            console.error(
                "QuickCommerce API error:",
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


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;