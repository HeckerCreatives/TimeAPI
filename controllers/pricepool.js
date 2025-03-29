const { default: mongoose } = require("mongoose")
const Pricepool = require("../models/Pricepool")
const Inventory = require("../models/Inventory")


exports.updatepricepool = async (req, res) => {

    const { id, currentvalue, pricepool, tiers } = req.body

    if(!id){
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    }

    if(!currentvalue && !pricepool){
        return res.status(400).json({ message: "failed", data: "Please input value in price pool or current value."})
    }

    const updatedFields = {};
    if (currentvalue) updatedFields.currentvalue = currentvalue;
    if (pricepool) updatedFields.pricepool = pricepool;
    if (tiers) updatedFields.tiers = tiers; // Overwrite the tiers array

    await Pricepool.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updatedFields },
    )    
    .then(data => {
        return res.status(200).json({ message: "success" })
    })
    .catch(err => {
        console.log(`There's a problem encoutered while updating price pool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })
}

exports.getcurrentpricepool = async (req, res) => {
    await Pricepool.findOne({ status: "current"})
    .then( data => {
        if(!data){
            return res.status(400).json({ message: "failed", data: "No price pool data found."})
        }
        return res.status(200).json({ message: "success", data: data})
    })
    .catch(err => {
        console.log(`There's a problem encoutered while fetching price pool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })
}

exports.usergetpricepool = async (req, res) => {
    const { id } = req.user

    let boolean = true
    const currentpricepool = await Pricepool.findOne({ status: "current" })
    
    if (!currentpricepool || !currentpricepool.tiers || currentpricepool.tiers.length === 0) {
        boolean = false
    }

    const { tiers } = currentpricepool;

    const hasMatchingInventory = await Inventory.findOne({
        type: { $in: tiers }, 
        owner: new mongoose.Types.ObjectId(id)
    })

    if (!hasMatchingInventory) {
        boolean = false
    }


    return res.status(200).json({
        message: "success",
        data: currentpricepool,
        boolean: boolean
    });
}