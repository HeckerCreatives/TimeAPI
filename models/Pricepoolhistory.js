const { default: mongoose } = require("mongoose");


const PricepoolHistorySchema = new mongoose.Schema(
    {
        pricepool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pricepool",
        },
        Benificiary: {
            type: String,
            index: true
        },
        total: {
            type: Number,
            index: true,
        },
        totalusers: {
            type: Number,
            index: true,
        },
        distribution: {
            type: Number,
            index: true
        }
    },
    {
        timestamps: true,
    }
)

const PricepoolHistory = mongoose.model("PricepoolHistory", PricepoolHistorySchema);
module.exports = PricepoolHistory