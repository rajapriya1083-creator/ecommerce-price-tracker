import React, { useEffect, useState } from "react";
import API_URL from "../api";
import "./Wishlist.css";

function Wishlist({ userId, setPage }) {

    const activeUserId =
        userId ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("userId");
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // LOAD WISHLIST
    // ==========================================

    useEffect(() => {

        const loadWishlist = async () => {

            try {

                setLoading(true);

                // ------------------------------------------
                // LOGIN CHECK
                // ------------------------------------------

                if (!activeUserId) {

                    const savedWishlist =
                        localStorage.getItem("wishlist");

                    if (savedWishlist) {

                        const parsedWishlist =
                            JSON.parse(savedWishlist);

                        if (Array.isArray(parsedWishlist)) {

                            setWishlist(parsedWishlist);

                        }

                    }

                    return;
                }

                // ------------------------------------------
                // LOAD FROM BACKEND
                // ------------------------------------------

                const response = await fetch(
                    `${API_URL}/api/wishlist?userId=${encodeURIComponent(
                        activeUserId
                    )}`
                );

                const responseText =
                    await response.text();

                let data;

                try {

                    data = JSON.parse(responseText);

                } catch {

                    throw new Error(
                        "Backend returned an invalid wishlist response."
                    );

                }

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load wishlist."
                    );

                }

                // ------------------------------------------
                // BACKEND RETURNS ARRAY
                // ------------------------------------------

                const backendWishlist =
                    Array.isArray(data)
                        ? data
                        : data.wishlist || [];

                setWishlist(
                    backendWishlist
                );

                // ------------------------------------------
                // KEEP LOCAL STORAGE IN SYNC
                // ------------------------------------------

                localStorage.setItem(
                    "wishlist",
                    JSON.stringify(
                        backendWishlist
                    )
                );

            } catch (error) {

                console.error(
                    "Wishlist loading error:",
                    error
                );

                // ------------------------------------------
                // FALLBACK TO LOCAL STORAGE
                // ------------------------------------------

                try {

                    const savedWishlist =
                        localStorage.getItem("wishlist");

                    if (savedWishlist) {

                        const parsedWishlist =
                            JSON.parse(savedWishlist);

                        if (Array.isArray(parsedWishlist)) {

                            setWishlist(
                                parsedWishlist
                            );

                        } else {

                            setWishlist([]);

                        }

                    } else {

                        setWishlist([]);

                    }

                } catch {

                    setWishlist([]);

                }

            } finally {

                setLoading(false);

            }

        };

        loadWishlist();

    }, [activeUserId]);


    // ==========================================
    // REMOVE PRODUCT
    // ==========================================

    const removeFromWishlist = async (product) => {

        try {

            // ------------------------------------------
            // DELETE FROM BACKEND
            // ------------------------------------------

            if (activeUserId && product._id) {

                const response =
                    await fetch(
                        `${API_URL}/api/wishlist/${product._id}`,
                        {
                            method: "DELETE"
                        }
                    );

                const responseText =
                    await response.text();

                let data = {};

                try {

                    data =
                        JSON.parse(
                            responseText
                        );

                } catch {

                    data = {};

                }

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to remove wishlist product."
                    );

                }

            }

            // ------------------------------------------
            // UPDATE STATE
            // ------------------------------------------

            const updatedWishlist =
                wishlist.filter(
                    item =>
                        item._id !== product._id
                );

            setWishlist(
                updatedWishlist
            );

            // ------------------------------------------
            // UPDATE LOCAL STORAGE
            // ------------------------------------------

            localStorage.setItem(
                "wishlist",
                JSON.stringify(
                    updatedWishlist
                )
            );

        } catch (error) {

            console.error(
                "Remove wishlist error:",
                error
            );

            alert(
                error.message ||
                "Unable to remove product."
            );

        }

    };


    // ==========================================
    // CLEAR WISHLIST
    // ==========================================

    const clearWishlist = async () => {

        try {

            // ------------------------------------------
            // DELETE EACH BACKEND ITEM
            // ------------------------------------------

            if (activeUserId) {

                for (
                    const product of wishlist
                ) {

                    if (product._id) {

                        await fetch(
                            `${API_URL}/api/wishlist/${product._id}`,
                            {
                                method: "DELETE"
                            }
                        );

                    }

                }

            }

            // ------------------------------------------
            // CLEAR STATE
            // ------------------------------------------

            setWishlist([]);

            // ------------------------------------------
            // CLEAR LOCAL STORAGE
            // ------------------------------------------

            localStorage.removeItem(
                "wishlist"
            );

        } catch (error) {

            console.error(
                "Clear wishlist error:",
                error
            );

            alert(
                "Unable to clear wishlist."
            );

        }

    };


    // ==========================================
    // GO BACK
    // ==========================================

    const handleBack = () => {

        if (setPage) {

            setPage("prices");

        } else {

            window.history.back();

        }

    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="wishlist-page">

                <div className="wishlist-header">

                    <button
                        className="back-button"
                        onClick={handleBack}
                    >
                        ← Back
                    </button>

                    <h1>
                        ❤️ My Wishlist
                    </h1>

                </div>

                <div className="empty-wishlist">

                    <div className="empty-icon">
                        ❤️
                    </div>

                    <h2>
                        Loading Wishlist...
                    </h2>

                </div>

            </div>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div className="wishlist-page">

            {/* HEADER */}

            <div className="wishlist-header">

                <button
                    className="back-button"
                    onClick={handleBack}
                >
                    ← Back
                </button>

                <h1>
                    ❤️ My Wishlist
                </h1>

                {wishlist.length > 0 && (

                    <button
                        className="clear-button"
                        onClick={clearWishlist}
                    >
                        🗑️ Clear Wishlist
                    </button>

                )}

            </div>


            {/* EMPTY WISHLIST */}

            {wishlist.length === 0 ? (

                <div className="empty-wishlist">

                    <div className="empty-icon">
                        ❤️
                    </div>

                    <h2>
                        Your Wishlist is Empty
                    </h2>

                    <p>
                        Add products to your wishlist
                        and they will appear here.
                    </p>

                    <button
                        className="browse-button"
                        onClick={() => {

                            if (setPage) {

                                setPage("search");

                            }

                        }}
                    >
                        🔎 Search Products
                    </button>

                </div>

            ) : (

                /* PRODUCTS */

                <div className="wishlist-container">

                    <div className="wishlist-count">

                        ❤️ {wishlist.length}{" "}

                        {wishlist.length === 1
                            ? "Product"
                            : "Products"}

                    </div>


                    <div className="wishlist-grid">

                        {wishlist.map(
                            (product, index) => (

                                <div
                                    className="wishlist-card"
                                    key={
                                        product._id ||
                                        product.id ||
                                        index
                                    }
                                >

                                    {/* IMAGE */}

                                    <div className="wishlist-image-container">

                                        {product.image ? (

                                            <img
                                                src={
                                                    product.image
                                                }
                                                alt={
                                                    product.productName ||
                                                    product.name ||
                                                    product.title ||
                                                    "Product"
                                                }
                                                className="wishlist-image"
                                                onError={(e) => {

                                                    e.target.style.display =
                                                        "none";

                                                }}
                                            />

                                        ) : (

                                            <div className="no-image">
                                                📦
                                            </div>

                                        )}

                                    </div>


                                    {/* PRODUCT DETAILS */}

                                    <div className="wishlist-details">

                                        <h2>

                                            {
                                                product.productName ||
                                                product.name ||
                                                product.title ||
                                                "Unknown Product"
                                            }

                                        </h2>


                                        {product.store && (

                                            <p className="wishlist-store">

                                                🏪{" "}

                                                {
                                                    product.store
                                                }

                                            </p>

                                        )}


                                        {(
                                            product.currentPrice ??
                                            product.price
                                        ) > 0 && (

                                            <p className="wishlist-price">

                                                ₹
                                                {Number(
                                                    product.currentPrice ??
                                                    product.price
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </p>

                                        )}


                                        {/* VISIT STORE */}

                                        {product.productUrl ? (

                                            <a
                                                href={
                                                    product.productUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="visit-store"
                                            >
                                                🛍️ Visit Store
                                            </a>

                                        ) : (

                                            <span>
                                                Store link not available
                                            </span>

                                        )}


                                        {/* REMOVE */}

                                        <button
                                            className="remove-button"
                                            onClick={() =>
                                                removeFromWishlist(
                                                    product
                                                )
                                            }
                                        >
                                            ❌ Remove
                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>

            )}

        </div>

    );

}

export default Wishlist;