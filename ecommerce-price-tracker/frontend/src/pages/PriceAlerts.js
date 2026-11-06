import React, { useCallback, useEffect, useState } from "react";
import API_URL from "../api";
import "./PriceAlerts.css";

const PRICE_ALERTS_API = `${API_URL}/api/price-alerts`;

function PriceAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeAlert, setActiveAlert] = useState(null);
    const [targetPrices, setTargetPrices] = useState({});

    // ==========================================
    // BACKEND URL
    // ==========================================

    // ==========================================
    // GET PRICE ALERTS
    // ==========================================

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(PRICE_ALERTS_API);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load price alerts"
                );
            }

            const alertList = Array.isArray(data)
                ? data
                : data.alerts || [];

            setAlerts(alertList);

        } catch (err) {
            console.error("Fetch alerts error:", err);

            setError(
                err.message || "Unable to connect to backend"
            );

        } finally {
            setLoading(false);
        }
    }, []);


    // ==========================================
    // LOAD ALERTS
    // ==========================================

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);


    // ==========================================
    // TARGET PRICE INPUT
    // ==========================================

    const handleTargetChange = (id, value) => {

        // Allow numbers only
        if (!/^\d*$/.test(value)) {
            return;
        }

        setTargetPrices((previous) => ({
            ...previous,
            [id]: value
        }));
    };


    // ==========================================
    // OPEN TARGET INPUT
    // ==========================================

    const openTargetInput = (id) => {

        setActiveAlert(id);
        setError("");

    };


    // ==========================================
    // CANCEL TARGET INPUT
    // ==========================================

    const cancelTargetInput = () => {

        setActiveAlert(null);
        setError("");

    };


    // ==========================================
    // SAVE TARGET PRICE
    // ==========================================

    const saveTargetPrice = async (alert) => {

        const value = targetPrices[alert._id] || "";

        if (value === "") {

            setError(
                "Please enter your target price."
            );

            return;
        }


        const targetPrice = Number(value);


        if (
            !Number.isFinite(targetPrice) ||
            targetPrice <= 0
        ) {

            setError(
                "Please enter a valid target price."
            );

            return;
        }


        if (
            targetPrice >=
            Number(alert.currentPrice)
        ) {

            setError(
                "Target price must be lower than current price."
            );

            return;
        }


        try {

            setError("");

            const response = await fetch(
                `${PRICE_ALERTS_API}/${alert._id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        targetPrice: targetPrice
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to save target price"
                );

            }


            // Update alert on screen

            setAlerts((previous) =>
                previous.map((item) => {

                    if (item._id === alert._id) {

                        return {
                            ...item,
                            targetPrice: targetPrice
                        };

                    }

                    return item;

                })
            );


            // Clear input

            setTargetPrices((previous) => {

                const updated = {
                    ...previous
                };

                delete updated[alert._id];

                return updated;

            });


            // Close input

            setActiveAlert(null);


        } catch (err) {

            console.error(
                "Save target price error:",
                err
            );

            setError(
                err.message ||
                "Unable to save target price"
            );

        }
    };


    // ==========================================
    // DELETE ALERT
    // ==========================================

    const deleteAlert = async (id) => {

        try {

            setError("");

            const response = await fetch(
                `${PRICE_ALERTS_API}/${id}`,
                {
                    method: "DELETE"
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete alert"
                );

            }


            setAlerts((previous) =>
                previous.filter(
                    (alert) =>
                        alert._id !== id
                )
            );


        } catch (err) {

            console.error(
                "Delete alert error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete alert"
            );

        }
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div className="price-alerts-page">

                <div className="alerts-container">

                    <h1>
                        🔔 Price Drop Alert
                    </h1>

                    <p>
                        Loading price alerts...
                    </p>

                </div>

            </div>
        );
    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div className="price-alerts-page">

            <div className="alerts-container">

                {/* HEADER */}

                <div className="alerts-header">

                    <h1>
                        🔔 Price Drop Alert
                    </h1>

                    <p>
                        Track products and get notified
                        when prices drop.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="alert-error">

                        ❌ {error}

                    </div>

                )}


                {/* NO ALERTS */}

                {alerts.length === 0 ? (

                    <div className="empty-alerts">

                        <h2>
                            🔔 No Price Alerts
                        </h2>

                        <p>
                            Set a target price to
                            start tracking a product.
                        </p>

                    </div>

                ) : (

                    /* ALERT LIST */

                    <div className="alerts-list">

                        {alerts.map(
                            (alert, index) => {

                                const currentPrice =
                                    Number(
                                        alert.currentPrice
                                    );


                                return (

                                    <div
                                        className="alert-box"
                                        key={alert._id}
                                    >

                                        {/* NUMBER */}

                                        <span className="alert-number">
                                            {index + 1}
                                        </span>


                                        {/* PRODUCT */}

                                        <span className="alert-product-name">
                                            {alert.productName}
                                        </span>


                                        {/* STORE */}

                                        <span className="alert-store">
                                            🏪 {alert.store}
                                        </span>


                                        {/* CURRENT PRICE */}

                                        <span className="alert-price">

                                            💰 Current Price:

                                            <strong>

                                                ₹
                                                {Number.isFinite(
                                                    currentPrice
                                                )
                                                    ? currentPrice.toLocaleString(
                                                        "en-IN"
                                                    )
                                                    : "N/A"}

                                            </strong>

                                        </span>


                                        {/* TARGET PRICE / SET ALERT */}

                                        {activeAlert ===
                                        alert._id ? (

                                            <div className="target-area">

                                                <input
                                                    className="target-input"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="Target price"
                                                    value={
                                                        targetPrices[
                                                            alert._id
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleTargetChange(
                                                            alert._id,
                                                            e.target.value
                                                        )
                                                    }
                                                    autoFocus
                                                />


                                                <button
                                                    className="save-button"
                                                    onClick={() =>
                                                        saveTargetPrice(
                                                            alert
                                                        )
                                                    }
                                                >
                                                    💾 Save
                                                </button>


                                                <button
                                                    className="cancel-button"
                                                    onClick={
                                                        cancelTargetInput
                                                    }
                                                >
                                                    ✕
                                                </button>

                                            </div>

                                        ) : (

                                            <button
                                                className="set-alert-button"
                                                onClick={() =>
                                                    openTargetInput(
                                                        alert._id
                                                    )
                                                }
                                            >
                                                🔔 Set Price Alert
                                            </button>

                                        )}


                                        {/* VISIT STORE */}

                                        {alert.productUrl && (

                                            <a
                                                className="visit-store-button"
                                                href={
                                                    alert.productUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                🛍️ Visit Store
                                            </a>

                                        )}


                                        {/* DELETE */}

                                        <button
                                            className="delete-button"
                                            onClick={() =>
                                                deleteAlert(
                                                    alert._id
                                                )
                                            }
                                            title="Delete Alert"
                                        >
                                            🗑️
                                        </button>

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}

            </div>

        </div>

    );
}

export default PriceAlerts;