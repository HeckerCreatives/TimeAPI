const mongoose = require("mongoose");

const inventoryShema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        type: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        name: {
            type: String,
            index: true
        },
        price: {
            type: Number
        },
        profit: {
            type: Number,
            index: true // Automatically creates an index on 'amount'
        },
        duration: {
            type: Number
        },
        startdate: {
            type: String,
            index: true // Automatically creates an index on 'amount'
        },
        isb1t1: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

const Inventory = mongoose.model("Inventory", inventoryShema)
module.exports = Inventory