import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../api";
import "./PriceComparison.css";

function readSelectedProduct() {
  const savedProduct = localStorage.getItem("selectedProduct");

  if (!savedProduct) {
    return null;
  }

  try {
    return JSON.parse(savedProduct);
  } catch (error) {
    console.error("Unable to read the selected product:", error);
    return null;
  }
}

function matchesSelectedStore(store, selectedStores) {
  if (selectedStores === null) {
    return true;
  }

  const normalizedStore = String(store || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return selectedStores.some((selectedStore) => {
    const normalizedSelection = selectedStore
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return normalizedStore.includes(normalizedSelection);
  });
}

function getStoreSearchUrl(productName, store) {
  const storeDomains = {
    Amazon: "amazon.in",
    Flipkart: "flipkart.com",
    Myntra: "myntra.com",
    AJIO: "ajio.com",
    Meesho: "meesho.com",
    "Tata CLiQ": "tatacliq.com",
    Croma: "croma.com",
    "Reliance Digital": "reliancedigital.in",
    Nykaa: "nykaa.com",
    Snapdeal: "snapdeal.com",
    JioMart: "jiomart.com",
  };
  const domain =
    storeDomains[store] ||
    storeDomains[
      Object.keys(storeDomains).find(
        (name) => name.toLowerCase() === store.toLowerCase()
      )
    ];
  const query = encodeURIComponent(
    `${productName}${domain ? ` site:${domain}` : ` ${store}`}`
  );

  return `https://www.google.com/search?q=${query}`;
}

function PriceComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedProduct] = useState(readSelectedProduct);
  const queryProduct = searchParams.get("product") || "";
  const selectedStoresParam = searchParams.get("stores");
  const selectedStores = useMemo(
    () =>
      selectedStoresParam === null
        ? null
        : selectedStoresParam.split(",").filter(Boolean),
    [selectedStoresParam]
  );
  const productName =
    queryProduct ||
    selectedProduct?.name ||
    selectedProduct?.title ||
    "";
  const [prices, setPrices] = useState([]);
  const [storeSearchFailures, setStoreSearchFailures] = useState([]);
  const [loading, setLoading] = useState(Boolean(productName));
  const [error, setError] = useState("");
  const [wishlistStatuses, setWishlistStatuses] = useState({});
  const [alertTargets, setAlertTargets] = useState({});
  const [alertStatuses, setAlertStatuses] = useState({});

  useEffect(() => {
    if (!productName) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const fetchPrices = async () => {
      setLoading(true);
      setError("");

      try {
        const priceSearchParams = new URLSearchParams({ productName });
        if (selectedStores !== null) {
          priceSearchParams.set("stores", selectedStores.join(","));
        }

        const response = await fetch(
          `${API_URL}/api/prices/search?${priceSearchParams.toString()}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load prices for this product.");
        }

        setPrices(Array.isArray(data.prices) ? data.prices : []);
        setStoreSearchFailures(
          Array.isArray(data.storeSearchFailures) ? data.storeSearchFailures : []
        );
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error("Error fetching comparison prices:", fetchError);
          setError(fetchError.message || "Unable to load comparison prices.");
          setPrices([]);
          setStoreSearchFailures([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPrices();
    return () => controller.abort();
  }, [productName, selectedStores, selectedStoresParam]);

  const selectedProductName = selectedProduct?.name || selectedProduct?.title;
  const fallbackPrice =
    selectedProduct && selectedProductName === productName
    ? {
        productName,
        store:
          selectedProduct.store?.name ||
          selectedProduct.store ||
          "Selected store",
        currentPrice:
          selectedProduct.currentPrice ??
          selectedProduct.offer_price ??
          selectedProduct.price,
        productUrl:
          selectedProduct.productUrl ||
          selectedProduct.deeplink ||
          selectedProduct.url,
        image: selectedProduct.image,
      }
    : null;
  const availablePrices =
    prices.length > 0 ? prices : fallbackPrice ? [fallbackPrice] : [];
  const comparisonPrices =
    selectedStores === null
      ? availablePrices
      : selectedStores.map((store) =>
          availablePrices.find((price) =>
            matchesSelectedStore(price.store, [store])
          ) || {
            productName,
            store,
            noOffer: true,
            productUrl: getStoreSearchUrl(productName, store),
            searchFailed: storeSearchFailures.some(
              (failedStore) =>
                failedStore.toLowerCase() === store.toLowerCase()
            ),
          }
        );
  const bestPrice = comparisonPrices.reduce((best, current) => {
    const currentPrice = Number(current.currentPrice ?? current.price);
    const bestPriceValue = best
      ? Number(best.currentPrice ?? best.price)
      : Infinity;

    return currentPrice > 0 && currentPrice < bestPriceValue ? current : best;
  }, null);

  const getRowKey = (price, index) =>
    price._id || `${price.store || "store"}-${price.productUrl || index}`;

  const addProductToWishlist = async (price, index) => {
    const rowKey = getRowKey(price, index);
    const userId = localStorage.getItem("userId");
    const rowPrice = Number(price.currentPrice ?? price.price ?? 0);
    const productUrl =
      price.productUrl ||
      price.deeplink ||
      price.url ||
      "";
    const image =
      price.image ||
      (selectedProduct?.name === productName
        ? selectedProduct.image || selectedProduct.images?.[0]
        : "") ||
      "";

    setWishlistStatuses((statuses) => ({
      ...statuses,
      [rowKey]: { status: "saving", message: "" },
    }));

    try {
      if (userId) {
        const response = await fetch(`${API_URL}/api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            productName,
            store: price.store || "Online store",
            price: rowPrice,
            image,
            productUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (/already exists/i.test(data.message || "")) {
            setWishlistStatuses((statuses) => ({
              ...statuses,
              [rowKey]: { status: "saved", message: "Already in wishlist." },
            }));
            return;
          }

          throw new Error(data.message || "Unable to add product to wishlist.");
        }
      } else {
        const saved = localStorage.getItem("wishlist");
        const wishlist = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(wishlist)) {
          throw new Error("Saved wishlist data is invalid.");
        }

        const alreadySaved = wishlist.some((item) =>
          String(item.productName || item.name || item.title || "")
            .trim()
            .toLowerCase() === productName.trim().toLowerCase() &&
          String(item.store || "").trim().toLowerCase() ===
            String(price.store || "Online store").trim().toLowerCase()
        );

        if (alreadySaved) {
          setWishlistStatuses((statuses) => ({
            ...statuses,
            [rowKey]: { status: "saved", message: "Already in wishlist." },
          }));
          return;
        }

        wishlist.push({
          id: `wishlist-${Date.now()}`,
          productName,
          store: price.store || "Online store",
          price: rowPrice,
          image,
          productUrl,
        });

        localStorage.setItem("wishlist", JSON.stringify(wishlist));
      }

      setWishlistStatuses((statuses) => ({
        ...statuses,
        [rowKey]: { status: "saved", message: "Added to wishlist." },
      }));
    } catch (error) {
      console.error("Unable to add product to wishlist:", error);
      setWishlistStatuses((statuses) => ({
        ...statuses,
        [rowKey]: {
          status: "error",
          message: error.message || "Unable to add product.",
        },
      }));
    }
  };

  const createPriceAlert = async (price, index) => {
    const rowKey = getRowKey(price, index);
    const currentPrice = Number(price.currentPrice ?? price.price);
    const targetPrice = Number(alertTargets[rowKey]);

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setAlertStatuses((statuses) => ({
        ...statuses,
        [rowKey]: { status: "error", message: "Enter a valid target price." },
      }));
      return;
    }

    if (targetPrice >= currentPrice) {
      setAlertStatuses((statuses) => ({
        ...statuses,
        [rowKey]: {
          status: "error",
          message: "Target price must be lower than current price.",
        },
      }));
      return;
    }

    setAlertStatuses((statuses) => ({
      ...statuses,
      [rowKey]: { status: "saving", message: "" },
    }));

    try {
      const response = await fetch(`${API_URL}/api/price-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          store: price.store || "Online store",
          productUrl: price.productUrl || price.deeplink || price.url || "",
          image: price.image || "",
          currentPrice,
          targetPrice,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create price alert.");
      }

      setAlertStatuses((statuses) => ({
        ...statuses,
        [rowKey]: { status: "saved", message: "Price alert created." },
      }));
    } catch (error) {
      console.error("Unable to create price alert:", error);
      setAlertStatuses((statuses) => ({
        ...statuses,
        [rowKey]: {
          status: "error",
          message: error.message || "Unable to create price alert.",
        },
      }));
    }
  };

  return (
    <div className="comparison-page">
      <main className="comparison-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <header className="comparison-header">
          <h1>💰 Price Comparison</h1>
          <p>
            {productName
              ? `Compare available prices for ${productName}.`
              : "Choose a product to see its available prices."}
          </p>
        </header>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="no-prices" role="status">
            Loading prices…
          </div>
        ) : !productName ? (
          <div className="no-prices">
            <h2>No product selected</h2>
            <p>Search for a product first, then select Compare Price.</p>
            <Link className="visit-store-button" to="/search">
              Search products
            </Link>
          </div>
        ) : (
          <>
            <section className="best-price-box">
              <h2>Best available price</h2>
              {bestPrice ? (
                <>
                  <h3>
                    ₹{Number(bestPrice.currentPrice ?? bestPrice.price).toLocaleString("en-IN")}
                  </h3>
                  <p>{bestPrice.store || "Online store"}</p>
                </>
              ) : (
                <p>No current price is available to show.</p>
              )}
            </section>

            {comparisonPrices.length > 0 && (
              <h2 className="comparison-offers-heading">Available store prices</h2>
            )}

            {comparisonPrices.length > 0 ? (
              <div className="price-table-wrapper">
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Store</th>
                      <th>Price</th>
                      <th>Wishlist</th>
                      <th>Price Alert</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonPrices.map((price, index) => {
                      const amount = Number(price.currentPrice ?? price.price);
                      const isBest = price === bestPrice;
                      const productUrl =
                        price.productUrl ||
                        price.deeplink ||
                        price.url ||
                        (price.noOffer || amount <= 0
                          ? getStoreSearchUrl(productName, price.store)
                          : "");
                      const rowKey = getRowKey(price, index);
                      const wishlistState =
                        wishlistStatuses[rowKey] || { status: "idle", message: "" };
                      const alertState =
                        alertStatuses[rowKey] || { status: "idle", message: "" };

                      return (
                        <tr className={isBest ? "best-row" : ""} key={rowKey}>
                          <td>
                            {price.productName || productName}
                            {isBest && <span className="best-badge">Best price</span>}
                          </td>
                          <td>{price.store || "Online store"}</td>
                          <td className="price-value">
                            {price.noOffer
                              ? price.searchFailed
                                ? "Could not retrieve price"
                                : "Price unavailable — check store"
                              : amount > 0
                                ? `₹${amount.toLocaleString("en-IN")}`
                                : "Price unavailable"}
                          </td>
                          <td>
                            {!price.noOffer && (
                              <button
                                type="button"
                                className="wishlist-button"
                                onClick={() => addProductToWishlist(price, index)}
                                disabled={
                                  wishlistState.status === "saving" ||
                                  wishlistState.status === "saved"
                                }
                              >
                                {wishlistState.status === "saving"
                                  ? "Adding..."
                                  : wishlistState.status === "saved"
                                    ? "♥ Added"
                                    : "♡ Add"}
                              </button>
                            )}
                            {wishlistState.message && (
                              <p
                                className={`row-action-feedback ${wishlistState.status === "saved" ? "row-action-success" : ""}`}
                                role="status"
                              >
                                {wishlistState.message}
                              </p>
                            )}
                          </td>
                          <td>
                            {!price.noOffer && <div className="alert-inline">
                              <input
                                className="alert-target-input"
                                type="number"
                                min="1"
                                max={amount > 0 ? amount - 1 : undefined}
                                step="any"
                                value={alertTargets[rowKey] || ""}
                                onChange={(event) =>
                                  setAlertTargets((targets) => ({
                                    ...targets,
                                    [rowKey]: event.target.value,
                                  }))
                                }
                                aria-label={`Target price for ${productName} at ${price.store || "online store"}`}
                                placeholder="Target ₹"
                                disabled={
                                  alertState.status === "saving" ||
                                  alertState.status === "saved"
                                }
                              />
                              <button
                                type="button"
                                className="save-alert-button"
                                onClick={() => createPriceAlert(price, index)}
                                disabled={
                                  alertState.status === "saving" ||
                                  alertState.status === "saved"
                                }
                              >
                                {alertState.status === "saving"
                                  ? "Saving..."
                                  : alertState.status === "saved"
                                    ? "Created"
                                    : "Create Alert"}
                              </button>
                            </div>}
                            {alertState.message && (
                              <p
                                className={`row-action-feedback ${alertState.status === "saved" ? "row-action-success" : ""}`}
                                role="status"
                              >
                                {alertState.message}
                              </p>
                            )}
                          </td>
                          <td>
                            {productUrl ? (
                              <a
                                className="visit-store-button"
                                href={productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {price.noOffer || amount <= 0
                                  ? "Search Store"
                                  : "Visit Store"}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-prices">
                {selectedStores === null
                  ? "No price offers are available for this product right now."
                  : "No price offers are available at the selected stores."}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default PriceComparison;
