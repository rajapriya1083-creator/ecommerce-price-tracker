const Product = require("../models/Product");

// =====================================================
// ADD PRODUCT
// POST /api/products
// =====================================================

const addProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            category,
            description,
            image
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Product name is required"
            });
        }

        const existingProduct = await Product.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            }
        });

        if (existingProduct) {
            return res.status(409).json({
                message: "Product already exists",
                product: existingProduct
            });
        }

        const product = await Product.create({
            name: name.trim(),

            brand: brand
                ? brand.trim()
                : "",

            category: category
                ? category.trim()
                : "",

            description: description
                ? description.trim()
                : "",

            image: image
                ? image.trim()
                : ""
        });

        return res.status(201).json({
            message: "Product added successfully",
            product
        });

    } catch (error) {
        console.error("Add product error:", error);

        return res.status(500).json({
            message: "Failed to add product",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .sort({
                createdAt: -1
            });

        return res.status(200).json(products);

    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// =====================================================
// SEARCH PRODUCTS
// GET /api/products/search?name=laptop
// =====================================================

const searchProducts = async (req, res) => {
    try {
        const searchText = req.query.name?.trim();

        if (!searchText) {
            return res.status(400).json({
                message: "Please enter a product name",
                products: []
            });
        }

        const products = await Product.find({
            $or: [
                {
                    name: {
                        $regex: searchText,
                        $options: "i"
                    }
                },
                {
                    brand: {
                        $regex: searchText,
                        $options: "i"
                    }
                },
                {
                    category: {
                        $regex: searchText,
                        $options: "i"
                    }
                }
            ]
        }).sort({
            name: 1
        });

        console.log("PRODUCT SEARCH:", searchText);
        console.log("PRODUCTS FOUND:", products.length);

        return res.status(200).json({
            message: "Products found successfully",
            products
        });

    } catch (error) {
        console.error("Search products error:", error);

        return res.status(500).json({
            message: "Failed to search products",
            error: error.message,
            products: []
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    addProduct,
    getProducts,
    searchProducts
};