const PriceAlert = require("../models/PriceAlert");


// ==========================================
// CREATE PRICE ALERT
// ==========================================

const createPriceAlert = async (req, res) => {

    try {

        const {
            productName,
            store,
            productUrl,
            image,
            currentPrice,
            targetPrice
        } = req.body;


        // Validation

        if (
            !productName ||
            !store ||
            currentPrice === undefined ||
            targetPrice === undefined
        ) {

            return res.status(400).json({
                message: "All required fields are needed"
            });

        }


        const current =
            Number(currentPrice);

        const target =
            Number(targetPrice);


        if (
            Number.isNaN(current) ||
            Number.isNaN(target)
        ) {

            return res.status(400).json({
                message: "Price must be a valid number"
            });

        }


        if (target <= 0) {

            return res.status(400).json({
                message: "Target price must be greater than 0"
            });

        }


        // Create alert

        const alert =
            await PriceAlert.create({

                productName:
                    productName.trim(),

                store:
                    store.trim(),

                productUrl:
                    productUrl || "",

                image:
                    image || "",

                currentPrice:
                    current,

                targetPrice:
                    target,

                alertReached:
                    current <= target

            });


        res.status(201).json({

            message:
                "Price alert created successfully",

            alert

        });


    } catch (error) {

        console.error(
            "Create price alert error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to create price alert",

            error:
                error.message

        });

    }

};


// ==========================================
// GET ALL PRICE ALERTS
// ==========================================

const getPriceAlerts = async (req, res) => {

    try {

        const alerts =
            await PriceAlert
                .find()
                .sort({
                    createdAt: -1
                });


        res.status(200).json(
            alerts
        );


    } catch (error) {

        console.error(
            "Get price alerts error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch price alerts",

            error:
                error.message

        });

    }

};


// ==========================================
// UPDATE PRICE ALERT
// ==========================================

const updatePriceAlert = async (req, res) => {

    try {

        const {
            targetPrice
        } = req.body;


        const target =
            Number(targetPrice);


        if (
            Number.isNaN(target) ||
            target <= 0
        ) {

            return res.status(400).json({

                message:
                    "Enter a valid target price"

            });

        }


        const alert =
            await PriceAlert.findByIdAndUpdate(

                req.params.id,

                {
                    targetPrice:
                        target,

                    alertReached:
                        false
                },

                {
                    new: true
                }

            );


        if (!alert) {

            return res.status(404).json({

                message:
                    "Price alert not found"

            });

        }


        res.status(200).json({

            message:
                "Price alert updated successfully",

            alert

        });


    } catch (error) {

        console.error(
            "Update price alert error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to update price alert",

            error:
                error.message

        });

    }

};


// ==========================================
// DELETE PRICE ALERT
// ==========================================

const deletePriceAlert = async (req, res) => {

    try {

        const alert =
            await PriceAlert.findByIdAndDelete(
                req.params.id
            );


        if (!alert) {

            return res.status(404).json({

                message:
                    "Price alert not found"

            });

        }


        res.status(200).json({

            message:
                "Price alert deleted successfully"

        });


    } catch (error) {

        console.error(
            "Delete price alert error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to delete price alert",

            error:
                error.message

        });

    }

};


// ==========================================
// CHECK PRICE ALERTS
// ==========================================

const checkPriceAlerts = async (req, res) => {

    try {

        const alerts =
            await PriceAlert.find();


        let reachedCount = 0;


        for (const alert of alerts) {

            const reached =
                alert.currentPrice <=
                alert.targetPrice;


            if (reached !== alert.alertReached) {

                alert.alertReached =
                    reached;

                await alert.save();

            }


            if (reached) {

                reachedCount++;

            }

        }


        res.status(200).json({

            message:
                "Price alerts checked successfully",

            reachedCount

        });


    } catch (error) {

        console.error(
            "Check price alerts error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to check price alerts",

            error:
                error.message

        });

    }

};


// ==========================================
// DROPPED / REACHED ALERTS
// ==========================================

const getDroppedPrices = async (req, res) => {

    try {

        const alerts =
            await PriceAlert
                .find({
                    alertReached: true
                })
                .sort({
                    updatedAt: -1
                });


        res.status(200).json(
            alerts
        );


    } catch (error) {

        console.error(
            "Get dropped prices error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch reached alerts",

            error:
                error.message

        });

    }

};


module.exports = {

    createPriceAlert,

    getPriceAlerts,

    updatePriceAlert,

    deletePriceAlert,

    checkPriceAlerts,

    getDroppedPrices

};