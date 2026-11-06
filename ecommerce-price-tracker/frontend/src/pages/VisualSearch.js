import React, { useRef, useState } from "react";
import API_URL from "../api";
import "./VisualSearch.css";
import { useNavigate } from "react-router-dom";

function VisualSearch({ onCompare, onBack }) {

    const navigate = useNavigate();

    const galleryInputRef = useRef(null);

    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [loading, setLoading] = useState(false);

    const [result, setResult] = useState(null);

    const [error, setError] = useState("");


    // =====================================
    // SELECT IMAGE
    // =====================================

    const handleImage = (file) => {

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            setError(
                "Please select a valid image."
            );

            return;
        }

        setError("");
        setResult(null);

        setSelectedImage(file);

        const imageURL =
            URL.createObjectURL(file);

        setPreview(imageURL);
    };


    // =====================================
    // GALLERY
    // =====================================

    const handleGallery = (event) => {

        const file =
            event.target.files[0];

        handleImage(file);

        event.target.value = "";
    };


    // =====================================
    // SEARCH IMAGE
    // =====================================

    const searchByImage = async () => {

        if (!selectedImage) {

            setError(
                "Please select a product image first."
            );

            return;
        }

        try {

            setLoading(true);
            setError("");
            setResult(null);


            // Create FormData
            const formData =
                new FormData();

            formData.append(
                "image",
                selectedImage
            );


            console.log(
                "Sending image to backend..."
            );


            // Send image to backend
            const response =
                await fetch(
                    `${API_URL}/api/visual-search`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            console.log(
                "Backend response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Visual search failed"
                );
            }


            // Save result
            setResult(data);


        } catch (error) {

            console.error(
                "Visual search error:",
                error
            );

            setError(
                error.message ||
                "Unable to identify product"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================
    // FIND BEST PRICE
    // =====================================

    const findBestPrice = () => {
        if (!result?.productName) return;

        if (typeof onCompare === "function") {
            onCompare(result.productName);
        } else {
            navigate(`/compare?product=${encodeURIComponent(result.productName)}`);
        }
    };


    // =====================================
    // UI
    // =====================================

    return (

        <div className="visual-search-page">

            <div className="visual-search-container">


                {/* BACK BUTTON */}

                <button
                    className="back-button"
                    onClick={() => (typeof onBack === "function" ? onBack() : navigate("/dashboard"))}
                >
                    ← Back
                </button>


                {/* HEADER */}

                <div className="visual-header">

                    <h1>
                        📷 Visual Search
                    </h1>

                    <p>
                        Choose a product photo
                        from your gallery.
                    </p>

                </div>


                {/* CAMERA + GALLERY */}

                <div className="visual-buttons">

                    <button
                        className="gallery-button"
                        onClick={() =>
                            galleryInputRef.current.click()
                        }
                    >
                        🖼️ Choose from Gallery
                    </button>

                </div>


                {/* GALLERY INPUT */}

                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGallery}
                    style={{
                        display: "none"
                    }}
                />


                {/* IMAGE PREVIEW */}

                {preview && (

                    <div className="image-preview">

                        <h2>
                            Selected Product
                        </h2>

                        <img
                            src={preview}
                            alt="Selected product"
                        />


                        <button
                            className="search-image-button"
                            onClick={searchByImage}
                            disabled={loading}
                        >

                            {loading
                                ? "🔎 Identifying Product..."
                                : "🔎 Search Product"
                            }

                        </button>

                    </div>
                )}


                {/* ERROR */}

                {error && (

                    <p className="visual-error">
                        ❌ {error}
                    </p>

                )}


                {/* RESULT */}

                {result && (

                    <div className="visual-result">

                        <h2>
                            ✅ Product Found
                        </h2>


                        <h3>
                            {result.productName}
                        </h3>


                        <p>
                            Product detected
                            successfully from
                            the image.
                        </p>


                        <button
                            className="compare-button"
                            onClick={findBestPrice}
                        >
                            🏆 Find Best Price
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
}

export default VisualSearch;
