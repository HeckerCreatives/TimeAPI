const { default: mongoose } = require("mongoose")
const Payin = require("../models/Payin")

exports.createpayin = async (id, amount, processby, status) => {
    const data = await Payin.create({owner: new mongoose.Types.ObjectId(id), value: amount, status: status, processby: new mongoose.Types.ObjectId(processby)})
    .catch(err => {

        console.log(`Failed to create Payin data for ${id}, error: ${err}`)

        return {
            message: "failed"
        }
    })

    return {
        message: "success",
        data: data
    }
}