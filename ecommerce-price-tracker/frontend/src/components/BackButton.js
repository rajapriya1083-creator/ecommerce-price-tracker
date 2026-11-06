import React from "react";

function BackButton({ onBack }) {
    return (
        <button
            onClick={onBack}
            style={{
                padding: "10px 20px",
                margin: "20px",
                border: "none",
                borderRadius: "8px",
                background: "#222",
                color: "white",
                cursor: "pointer",
                fontSize: "15px"
            }}
        >
            ← Back
        </button>
    );
}

export default BackButton;