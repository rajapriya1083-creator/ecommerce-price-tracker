const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

const visualSearch = async (req, res) => {

    try {

        // ==========================================
        // CHECK API KEY
        // ==========================================

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message: "Gemini API key is missing"
            });
        }

        // ==========================================
        // CHECK IMAGE
        // ==========================================

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload an image"
            });
        }

        console.log("Image received:", req.file.originalname);
        console.log("Image type:", req.file.mimetype);

        // ==========================================
        // CREATE GEMINI CLIENT
        // ==========================================

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        // ==========================================
        // READ IMAGE
        // ==========================================

        const imageData = fs.readFileSync(req.file.path);

        const base64Image = imageData.toString("base64");

        // ==========================================
        // SEND IMAGE TO GEMINI
        // ==========================================

        console.log("Sending image to Gemini...");

        const response = await ai.models.generateContent({

            model: "gemini-3.5-flash",

            contents: [
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: base64Image
                    }
                },
                {
                    text: `
Identify the main product shown in this image.

Return ONLY the product name.

Examples:
iPhone 15
Samsung Galaxy S24
Dell Inspiron 15
Nike Air Max
Sony WH-1000XM5
HP Laptop

Rules:
- Identify the main product only.
- Do not give a description.
- Do not give the price.
- Do not give specifications.
- Do not use markdown.
- Do not explain your answer.
- Return only the product name.
`
                }
            ]

        });

        // ==========================================
        // GET PRODUCT NAME
        // ==========================================

        const productName =
            response.text
                ? response.text.trim()
                : "";

        console.log("Gemini response:", productName);

        // ==========================================
        // CHECK RESULT
        // ==========================================

        if (!productName) {

            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {}

            return res.status(500).json({
                message: "Gemini could not identify the product"
            });
        }

        // ==========================================
        // DELETE IMAGE
        // ==========================================

        try {
            fs.unlinkSync(req.file.path);
        } catch (e) {
            console.log("Could not delete uploaded image");
        }

        // ==========================================
        // SEND RESULT
        // ==========================================

        res.status(200).json({

            message: "Product identified successfully",

            productName: productName

        });

    } catch (error) {

        console.error(
            "VISUAL SEARCH ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        // Delete uploaded image
        if (req.file) {

            try {
                fs.unlinkSync(req.file.path);
            } catch (deleteError) {
                console.log("Could not delete image");
            }

        }

        res.status(500).json({

            message: "Unable to identify product",

            error:
                error.response?.data?.error ||
                error.message ||
                "Unknown error"

        });
    }
};

module.exports = {
    visualSearch
};