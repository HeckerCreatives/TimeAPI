const { default: mongoose } = require("mongoose")

            
const ChronoSchema = new mongoose.Schema({
    type: {
        type: String,
    },
    name: {
        type: String,
    },
    profit: {
        type: Number,
    },
    duration: {
        type: Number,
    },
    min: {
        type: Number,
    },
    max: {
        type: Number
    },
    isBuyonetakeone: {
        type: String,
    }
},
{ timestamps: true })
            
const Chrono = mongoose.model("Chrono", ChronoSchema)
module.exports = Chrono