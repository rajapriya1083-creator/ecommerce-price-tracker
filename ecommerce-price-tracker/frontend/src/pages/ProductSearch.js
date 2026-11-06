import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import "./ProductSearch.css";

const STORE_OPTIONS = [
    "Amazon",
    "Flipkart",
    "Myntra",
    "AJIO",
    "Meesho",
    "Tata CLiQ",
    "Croma",
    "Reliance Digital",
    "Nykaa",
    "Snapdeal",
    "JioMart"
];

function ProductSearch({ onCompare }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedStores, setSelectedStores] = useState([]);
    const [storeSearchTerm, setStoreSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Keeps "No products found" hidden until Search is clicked
    const [hasSearched, setHasSearched] = useState(false);

    const recordPriceHistory = async (term) => {
        try {
            const response = await fetch(
                `${API_URL}/api/prices/search?productName=${encodeURIComponent(term)}`
            );
            const data = await response.json();

            if (!response.ok) {
                console.warn(
                    "Unable to record price history for this search:",
                    data.message || response.statusText
                );
                return;
            }

            if (data.historySaved === false) {
                console.warn(
                    "Price search completed, but history could not be saved:",
                    data.historyWarning
                );
            }
        } catch (historyError) {
            console.warn(
                "Unable to record price history for this search:",
                historyError
            );
        }
    };


    // =====================================================
    // FALLBACK PRODUCTS
    // =====================================================

    const createFallbackProducts = (term) => {
        const search = term.toLowerCase();

        let category = "General";
        let basePrice = 999;


        if (
            search.includes("saree") ||
            search.includes("sari")
        ) {
            category = "Fashion";
            basePrice = 899;
        }


        else if (
            search.includes("dress") ||
            search.includes("shirt") ||
            search.includes("jeans") ||
            search.includes("tshirt") ||
            search.includes("t-shirt")
        ) {
            category = "Fashion";
            basePrice = 799;
        }


        else if (
            search.includes("iphone") ||
            search.includes("mobile") ||
            search.includes("phone") ||
            search.includes("samsung") ||
            search.includes("galaxy")
        ) {
            category = "Mobiles";
            basePrice = 14999;
        }


        else if (
            search.includes("laptop") ||
            search.includes("computer")
        ) {
            category = "Electronics";
            basePrice = 45999;
        }


        else if (
            search.includes("camera")
        ) {
            category = "Electronics";
            basePrice = 35999;
        }


        else if (
            search.includes("headphone") ||
            search.includes("earbud") ||
            search.includes("earphone")
        ) {
            category = "Audio";
            basePrice = 1499;
        }


        else if (
            search.includes("watch")
        ) {
            category = "Accessories";
            basePrice = 1999;
        }


        else if (
            search.includes("shoe") ||
            search.includes("shoes") ||
            search.includes("sandals")
        ) {
            category = "Footwear";
            basePrice = 1299;
        }


        else if (
            search.includes("tv") ||
            search.includes("television")
        ) {
            category = "Electronics";
            basePrice = 29999;
        }


        else if (
            search.includes("book") ||
            search.includes("books")
        ) {
            category = "Books";
            basePrice = 499;
        }


        else if (
            search.includes("bag") ||
            search.includes("backpack")
        ) {
            category = "Bags";
            basePrice = 999;
        }


        const displayName =
            term.charAt(0).toUpperCase() +
            term.slice(1);


        return [
            {
                id: "fallback-1-" + Date.now(),

                name: displayName,

                brand: "Various Brands",

                category: category,

                images: [],

                offer_price: basePrice,

                price: basePrice,

                mrp: Math.round(
                    basePrice * 1.2
                ),

                rating: 4.2,

                available: true,

                platform: {
                    name: "Amazon"
                },

                deeplink:
                    "https://www.amazon.in/s?k=" +
                    encodeURIComponent(term)
            }
        ];
    };


    // =====================================================
    // SEARCH PRODUCT
    // =====================================================

    const searchProduct = async () => {
        const term = searchTerm.trim();


        // =================================================
        // EMPTY SEARCH
        // =================================================

        if (!term) {
            setProducts([]);
            setError("");
            setHasSearched(false);
            return;
        }

        localStorage.setItem("priceHistoryProductName", term);
        setSelectedStores([]);
        setStoreSearchTerm("");

        try {
            setLoading(true);
            setError("");
            setProducts([]);

            // Search has actually happened
            setHasSearched(true);


            // =================================================
            // LIVE BACKEND SEARCH
            // =================================================

            try {

                /*
                 * IMPORTANT FIX
                 *
                 * ProductController.js uses:
                 *
                 * GET /api/products/search?name=laptop
                 *
                 * So React must send "name", not "q".
                 */

                const response = await fetch(
                    `${API_URL}/api/products/search?name=${encodeURIComponent(
                        term
                    )}`
                );


                const data = await response.json();


                console.log(
                    "PRODUCT SEARCH RESPONSE:",
                    data
                );


                // =================================================
                // LIVE PRODUCTS FOUND
                // =================================================

                if (
                    response.ok &&
                    Array.isArray(data.products) &&
                    data.products.length > 0
                ) {

                    /*
                     * ProductController returns:
                     *
                     * {
                     *   message: "...",
                     *   products: [...]
                     * }
                     *
                     * Keep existing behaviour:
                     * ONLY SHOW FIRST PRODUCT
                     */

                    setProducts([
                        data.products[0]
                    ]);

                    await recordPriceHistory(term);
                    return;
                }


            } catch (backendError) {

                console.log(
                    "Backend live search unavailable.",
                    backendError
                );

            }


            // =================================================
            // FALLBACK
            // =================================================

            const fallbackProducts =
                createFallbackProducts(term);


            setProducts(
                fallbackProducts
            );

            await recordPriceHistory(term);


        } catch (err) {

            console.error(
                "Product search error:",
                err
            );


            const fallbackProducts =
                createFallbackProducts(
                    searchTerm.trim()
                );


            setProducts(
                fallbackProducts
            );


        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // COMPARE PRODUCT
    // =====================================================

    const handleCompare = (product) => {
        console.log(
            "================================="
        );

        console.log(
            "SELECTED PRODUCT FOR COMPARISON:"
        );

        console.log(product);

        console.log(
            "================================="
        );


        // =================================================
        // PRODUCT NAME
        // =================================================

        const productName =
            product.name ||
            product.title ||
            searchTerm.trim();


        // =================================================
        // PRODUCT PRICE
        // =================================================

        const productPrice =
            Number(
                product.offer_price ??
                product.offerPrice ??
                product.price ??
                0
            );


        // =================================================
        // STORE
        // =================================================

        const store =
            product.platform?.name ||
            product.platform?.title ||
            product.store?.name ||
            product.store ||
            "Online Store";


        // =================================================
        // IMAGE
        // =================================================

        const image =
            Array.isArray(product.images) &&
            product.images.length > 0
                ? product.images[0]
                : product.image || "";


        // =================================================
        // PRODUCT URL
        // =================================================

        const productUrl =
            product.deeplink ||
            product.productUrl ||
            product.url ||
            product.link ||
            "";


        // =================================================
        // CREATE COMPLETE SELECTED PRODUCT
        // =================================================

        const selectedProduct = {

            ...product,

            name:
                productName,

            title:
                product.title ||
                productName,

            price:
                productPrice,

            currentPrice:
                productPrice,

            offer_price:
                product.offer_price ??
                productPrice,

            store:
                store,

            image:
                image,

            productUrl:
                productUrl

        };


        console.log(
            "FINAL SELECTED PRODUCT:"
        );

        console.log(
            selectedProduct
        );


        // =================================================
        // SAVE COMPLETE PRODUCT
        // =================================================

        localStorage.setItem(
            "selectedProduct",
            JSON.stringify(
                selectedProduct
            )
        );


        // =================================================
        // SAVE PRODUCT NAME
        // =================================================

        localStorage.setItem(
            "selectedProductName",
            productName
        );


        // =================================================
        // SAVE PRODUCT PRICE
        // =================================================

        localStorage.setItem(
            "selectedProductPrice",
            String(
                productPrice
            )
        );


        // =================================================
        // SAVE STORE
        // =================================================

        localStorage.setItem(
            "selectedProductStore",
            store
        );


        // =================================================
        // SAVE IMAGE
        // =================================================

        localStorage.setItem(
            "selectedProductImage",
            image
        );


        // =================================================
        // SAVE PRODUCT URL
        // =================================================

        localStorage.setItem(
            "selectedProductUrl",
            productUrl
        );


        // =================================================
        // SEND PRODUCT TO APP.JS
        // =================================================

        if (onCompare) {

            onCompare(
                selectedProduct,
                selectedStores
            );

            return;

        }


        // =================================================
        // FALLBACK NAVIGATION
        // =================================================

        const comparisonParams = new URLSearchParams({
            product: productName
        });

        if (selectedStores.length > 0) {
            comparisonParams.set("stores", selectedStores.join(","));
        }

        navigate(`/compare?${comparisonParams.toString()}`);

    };

    const storeRecommendations = STORE_OPTIONS.filter((store) =>
        store.toLowerCase().includes(storeSearchTerm.trim().toLowerCase()) &&
        !selectedStores.includes(store)
    );

    const addStore = (store) => {
        setSelectedStores((currentStores) =>
            currentStores.includes(store) ? currentStores : [...currentStores, store]
        );
        setStoreSearchTerm("");
    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div
            className="product-search-page"
        >

            <div
                className="search-container"
            >


                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="product-search-header">
                    <h1>
                        🔎 Product Search
                    </h1>

                    <p>
                        Compare prices across stores and find the best deal.
                    </p>
                </header>


                {/* =================================================
                    SEARCH BOX
                ================================================= */}

                <div
                    className="search-box"
                >

                    <input

                        type="text"

                        placeholder="Enter product name..."

                        value={
                            searchTerm
                        }

                        onChange={(e) => {

                            setSearchTerm(
                                e.target.value
                            );

                            setError("");

                        }}

                        onKeyDown={(e) => {

                            if (
                                e.key === "Enter"
                            ) {

                                searchProduct();

                            }

                        }}

                    />


                    <button

                        type="button"

                        onClick={
                            searchProduct
                        }

                        disabled={
                            loading
                        }

                    >

                        {loading
                            ? "Searching..."
                            : "🔎 Search"}

                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading &&
                    hasSearched &&
                    error && (

                    <div
                        className="search-error"
                    >

                        ❌ {error}

                    </div>

                )}


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div
                        className="search-loading"
                    >

                        🔄 Searching for
                        "{searchTerm}"...

                    </div>

                )}


                {/* =================================================
                    PRODUCT RESULT
                ================================================= */}

                {!loading &&
                    products.length > 0 && (

                    <div
                        className="product-results"
                    >

                        <h2>
                            📦 Product Found
                        </h2>


                        <div
                            className="products-grid"
                        >

                            {products
                                .slice(0, 1)
                                .map(
                                    (
                                        product,
                                        index
                                    ) => {


                                        // =================================
                                        // IMAGE
                                        // =================================

                                        const image =

                                            Array.isArray(
                                                product.images
                                            ) &&

                                            product.images.length > 0

                                                ? product.images[0]

                                                : product.image ||
                                                  "";


                                        // =================================
                                        // PRODUCT NAME
                                        // =================================

                                        const productName =

                                            product.name ||

                                            product.title ||

                                            "Product";


                                        return (

                                            <div

                                                className="product-result-card"

                                                key={

                                                    product.id ||

                                                    product._id ||

                                                    index

                                                }

                                            >


                                                {/* IMAGE */}

                                                <div
                                                    className="product-image"
                                                >

                                                    {image ? (

                                                        <img

                                                            src={
                                                                image
                                                            }

                                                            alt={
                                                                productName
                                                            }

                                                        />

                                                    ) : (

                                                        <div
                                                            className="no-product-image"
                                                        >

                                                            📦

                                                        </div>

                                                    )}

                                                </div>


                                                {/* DETAILS */}

                                                <div
                                                    className="product-details"
                                                >


                                                    <h2>

                                                        {
                                                            productName
                                                        }

                                                    </h2>


                                                    {/* BRAND */}

                                                    {product.brand && (

                                                        <p>

                                                            <strong>

                                                                Brand:

                                                            </strong>{" "}

                                                            {
                                                                product.brand
                                                            }

                                                        </p>

                                                    )}

                                                    <section
                                                        className="store-selection"
                                                        aria-labelledby="store-selection-heading"
                                                    >
                                                        <h3 id="store-selection-heading">
                                                            Stores to compare
                                                        </h3>
                                                        <p>
                                                            Optionally select stores to filter prices, or leave this blank to compare all available stores.
                                                        </p>
                                                        <div className="store-search">
                                                            <input
                                                                type="search"
                                                                value={storeSearchTerm}
                                                                onChange={(event) =>
                                                                    setStoreSearchTerm(event.target.value)
                                                                }
                                                                onKeyDown={(event) => {
                                                                    if (
                                                                        event.key === "Enter" &&
                                                                        storeRecommendations.length > 0
                                                                    ) {
                                                                        event.preventDefault();
                                                                        addStore(storeRecommendations[0]);
                                                                    }
                                                                }}
                                                                placeholder="Search stores (e.g. Amazon)"
                                                                aria-label="Search stores to compare"
                                                                aria-autocomplete="list"
                                                                aria-controls="store-recommendations"
                                                            />
                                                            {storeSearchTerm.trim() && (
                                                                <ul
                                                                    className="store-recommendations"
                                                                    id="store-recommendations"
                                                                    role="listbox"
                                                                >
                                                                    {storeRecommendations.length > 0 ? (
                                                                        storeRecommendations.map((store) => (
                                                                            <li key={store} role="option" aria-selected="false">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => addStore(store)}
                                                                                >
                                                                                    {store}
                                                                                </button>
                                                                            </li>
                                                                        ))
                                                                    ) : (
                                                                        <li className="store-no-recommendations">
                                                                            No store recommendations found.
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        {selectedStores.length > 0 && (
                                                            <ul className="selected-store-list" aria-label="Selected stores">
                                                                {selectedStores.map((store) => (
                                                                    <li key={store}>
                                                                        <span>{store}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setSelectedStores((currentStores) =>
                                                                                    currentStores.filter((selected) => selected !== store)
                                                                                )
                                                                            }
                                                                            aria-label={`Remove ${store}`}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {selectedStores.length === 0 && (
                                                            <p className="store-selection-warning" role="status">
                                                                No store filter selected — all available stores will be compared.
                                                            </p>
                                                        )}
                                                        {selectedStores.length > 0 && (
                                                            <p className="store-selected-count" role="status">
                                                                {selectedStores.length} {selectedStores.length === 1 ? "store" : "stores"} selected
                                                            </p>
                                                        )}
                                                    </section>


                                                    {/* AVAILABILITY */}

                                                    <p>

                                                        {

                                                            product.available !==
                                                            false

                                                                ? "🟢 Available"

                                                                : "🔴 Out of Stock"

                                                        }

                                                    </p>


                                                    {/* BUTTONS */}

                                                    <div
                                                        className="product-actions"
                                                    >


                                                        <button

                                                            type="button"

                                                            className="compare-product-button"

                                                            onClick={() =>
                                                                handleCompare(
                                                                    product
                                                                )
                                                            }

                                                        >

                                                            💰 Compare Price

                                                        </button>


                                                    </div>

                                                </div>

                                            </div>

                                        );

                                    }

                                )}

                        </div>

                    </div>

                )}


                {/* =================================================
                    NO RESULTS
                ================================================= */}

                {!loading &&

                    hasSearched &&

                    products.length === 0 &&

                    !error && (

                    <div
                        className="search-error"
                    >

                        ❌ No products found for
                        "{searchTerm}"

                    </div>

                )}

            </div>

        </div>

    );
}

export default ProductSearch;