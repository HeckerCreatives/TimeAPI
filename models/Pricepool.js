const { default: mongoose } = require("mongoose");



const PricepoolSchema = new mongoose.Schema(
    {
        pricepool: {
            type: Number,
            index: true
        },
        currentvalue: {
            type: Number,
            index: true,
        },
        status: {
            type: String,
            index: true,
        },
        tiers: [
            {
                type: String,
                index: true,
            }
        ]
    },
    {
        timestamps: true,
    }
)

const Pricepool = mongoose.model("Pricepool", PricepoolSchema);
module.exports = Pricepool