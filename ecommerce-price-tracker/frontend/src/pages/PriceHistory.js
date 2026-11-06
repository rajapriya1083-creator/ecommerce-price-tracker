import React, { useEffect, useState } from "react";
import API_URL from "../api";

const getInitialProductName = (productName) =>
    productName ||
    localStorage.getItem("priceHistoryProductName") ||
    localStorage.getItem("selectedProductName") ||
    "";

function PriceHistory({ productName, onBack }) {

    const [searchProduct, setSearchProduct] = useState(
        () => getInitialProductName(productName)
    );

    const [activeProduct, setActiveProduct] = useState(
        () => getInitialProductName(productName)
    );

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // ==========================================
    // LOAD PRICE HISTORY
    // ==========================================

    const loadHistory = async (name) => {

        if (!name || !name.trim()) {

            setHistory([]);

            return;

        }

        try {

            setLoading(true);

            setError("");

            const response = await fetch(
                `${API_URL}/api/price-history/${encodeURIComponent(
                    name.trim()
                )}`
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load price history"
                );

            }


            let records =
                Array.isArray(data.history)
                    ? data.history
                    : [];

            if (records.length === 0) {
                const liveResponse = await fetch(
                    `${API_URL}/api/prices/search?productName=${encodeURIComponent(
                        name.trim()
                    )}`
                );
                const liveData = await liveResponse.json();

                if (!liveResponse.ok) {
                    throw new Error(
                        liveData.message ||
                        "No price history is saved yet, and current prices could not be loaded."
                    );
                }

                if (liveData.historySaved === false) {
                    throw new Error(
                        liveData.historyWarning ||
                        "Current prices were found, but could not be saved to price history."
                    );
                }

                const refreshedResponse = await fetch(
                    `${API_URL}/api/price-history/${encodeURIComponent(
                        name.trim()
                    )}`
                );
                const refreshedData = await refreshedResponse.json();

                if (!refreshedResponse.ok) {
                    throw new Error(
                        refreshedData.message ||
                        "Failed to reload price history"
                    );
                }

                records = Array.isArray(refreshedData.history)
                    ? refreshedData.history
                    : [];
            }

            setHistory(records);

        } catch (err) {

            console.error(
                "Price History Error:",
                err
            );

            setError(
                err.message ||
                "Failed to load price history"
            );

            setHistory([]);

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // LOAD WHEN PRODUCT CHANGES
    // ==========================================

    useEffect(() => {

        const name = getInitialProductName(productName);

        if (name) {
            setSearchProduct(name);

            setActiveProduct(name);

            loadHistory(name);

        }

    }, [productName]);


    // ==========================================
    // SEARCH PRODUCT
    // ==========================================

    const handleSearch = (event) => {

        event.preventDefault();

        const name =
            searchProduct.trim();

        if (!name) {

            setError(
                "Please enter a product name."
            );

            return;

        }

        setActiveProduct(name);

        loadHistory(name);

    };


    // ==========================================
    // BACK
    // ==========================================

    const handleBack = () => {

        if (onBack) {

            onBack();

        }

    };


    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f5f6fa",
                padding: "35px 25px",
                boxSizing: "border-box"
            }}
        >

            <div
                style={{
                    maxWidth: "1250px",
                    margin: "0 auto"
                }}
            >

                {/* =================================
                    BACK
                ================================= */}

                <button
                    onClick={handleBack}
                    style={{
                        padding: "10px 18px",
                        border: "none",
                        borderRadius: "7px",
                        background: "#111827",
                        color: "white",
                        cursor: "pointer",
                        marginBottom: "25px"
                    }}
                >
                    ← Back
                </button>


                {/* =================================
                    TITLE
                ================================= */}

                <h1
                    style={{
                        margin: "0 0 8px",
                        fontSize: "30px",
                        color: "#222"
                    }}
                >
                    📈 Price History
                </h1>


                <p
                    style={{
                        color: "#666",
                        marginBottom: "25px"
                    }}
                >
                    View historical price changes
                    of products.
                </p>


                {/* =================================
                    PRODUCT SEARCH
                ================================= */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 2px 8px rgba(0,0,0,0.06)"
                    }}
                >

                    <form
                        onSubmit={handleSearch}
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap"
                        }}
                    >

                        <input
                            type="text"
                            value={searchProduct}
                            onChange={(e) =>
                                setSearchProduct(
                                    e.target.value
                                )
                            }
                            placeholder="Enter product name"
                            style={{
                                flex: 1,
                                minWidth: "250px",
                                height: "42px",
                                padding: "0 12px",
                                border:
                                    "1px solid #ccc",
                                borderRadius: "7px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />


                        <button
                            type="submit"
                            style={{
                                height: "42px",
                                padding:
                                    "0 20px",
                                border: "none",
                                borderRadius: "7px",
                                background:
                                    "#4f46e5",
                                color: "white",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            🔎 View History
                        </button>

                    </form>

                </div>


                {/* =================================
                    ACTIVE PRODUCT
                ================================= */}

                {activeProduct && (

                    <p
                        style={{
                            marginBottom: "20px",
                            color: "#555"
                        }}
                    >
                        Historical price changes for{" "}

                        <strong
                            style={{
                                color: "#222"
                            }}
                        >
                            {activeProduct}
                        </strong>

                    </p>

                )}


                {/* =================================
                    LOADING
                ================================= */}

                {loading && (

                    <div
                        style={{
                            background: "white",
                            padding: "30px",
                            borderRadius: "10px"
                        }}
                    >

                        Loading price history...

                    </div>

                )}


                {/* =================================
                    ERROR
                ================================= */}

                {!loading && error && (

                    <div
                        style={{
                            background:
                                "#ffe7e7",
                            border:
                                "1px solid #ffbebe",
                            color:
                                "#c62828",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}
                    >

                        {error}

                    </div>

                )}


                {/* =================================
                    NO PRODUCT SELECTED
                ================================= */}

                {!loading &&
                    !error &&
                    !activeProduct && (

                        <div
                            style={{
                                background: "white",
                                padding: "35px",
                                borderRadius: "10px",
                                boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.06)"
                            }}
                        >

                            <h2>
                                Product Price History
                            </h2>

                            <p
                                style={{
                                    color: "#666"
                                }}
                            >
                                Enter a product name
                                above to view its
                                price history.
                            </p>

                        </div>

                    )}


                {/* =================================
                    NO HISTORY
                ================================= */}

                {!loading &&
                    !error &&
                    activeProduct &&
                    history.length === 0 && (

                        <div
                            style={{
                                background: "white",
                                padding: "35px",
                                borderRadius: "10px",
                                boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.06)"
                            }}
                        >

                            <h2>
                                Product Price History
                            </h2>

                            <p
                                style={{
                                    color: "#666"
                                }}
                            >
                                No price history data
                                is available for{" "}

                                <strong>
                                    {activeProduct}
                                </strong>

                                {" "}yet.
                            </p>

                        </div>

                    )}


                {/* =================================
                    HISTORY TABLE
                ================================= */}

                {!loading &&
                    !error &&
                    history.length > 0 && (

                        <div
                            style={{
                                background: "white",
                                padding: "25px",
                                borderRadius: "10px",
                                boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.06)",
                                overflowX: "auto"
                            }}
                        >

                            <h2
                                style={{
                                    marginTop: 0,
                                    marginBottom:
                                        "20px"
                                }}
                            >
                                📊 Historical Prices
                            </h2>


                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse"
                                }}
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style={
                                                thStyle
                                            }
                                        >
                                            #
                                        </th>

                                        <th
                                            style={
                                                thStyle
                                            }
                                        >
                                            Product
                                        </th>

                                        <th
                                            style={
                                                thStyle
                                            }
                                        >
                                            Store
                                        </th>

                                        <th
                                            style={
                                                thStyle
                                            }
                                        >
                                            Price
                                        </th>

                                        <th
                                            style={
                                                thStyle
                                            }
                                        >
                                            Date
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {history.map(
                                        (
                                            item,
                                            index
                                        ) => {

                                            const product =
                                                item
                                                    .product
                                                    ?.name ||
                                                item.productName ||
                                                activeProduct;

                                            const store =
                                                item
                                                    .store
                                                    ?.name ||
                                                item.storeName ||
                                                "Unknown Store";

                                            const price =
                                                item.price ??
                                                item.currentPrice ??
                                                item.amount ??
                                                0;

                                            const date =
                                                item.createdAt ||
                                                item.date ||
                                                item.recordedAt;


                                            return (

                                                <tr
                                                    key={
                                                        item._id ||
                                                        index
                                                    }
                                                >

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </td>


                                                    <td
                                                        style={{
                                                            ...tdStyle,
                                                            fontWeight:
                                                                "600"
                                                        }}
                                                    >
                                                        {
                                                            product
                                                        }
                                                    </td>


                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        🏪{" "}
                                                        {
                                                            store
                                                        }
                                                    </td>


                                                    <td
                                                        style={{
                                                            ...tdStyle,
                                                            fontWeight:
                                                                "700"
                                                        }}
                                                    >
                                                        ₹
                                                        {
                                                            Number(
                                                                price
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )
                                                        }
                                                    </td>


                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {
                                                            date
                                                                ? new Date(
                                                                    date
                                                                ).toLocaleString(
                                                                    "en-IN"
                                                                )
                                                                : "-"
                                                        }
                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

            </div>

        </div>

    );

}


// ==========================================
// TABLE STYLES
// ==========================================

const thStyle = {

    textAlign: "left",

    padding: "12px",

    borderBottom:
        "2px solid #ddd",

    background: "#f8f8f8"

};


const tdStyle = {

    padding: "12px",

    borderBottom:
        "1px solid #eee"

};


export default PriceHistory;