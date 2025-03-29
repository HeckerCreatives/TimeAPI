const Inventory = require("../models/Inventory")
const Pricepool = require("../models/Pricepool")
const PricepoolHistory = require("../models/Pricepoolhistory")
const Userwallets = require("../models/Userwallets")



exports.distributepricepool = async (req, res) => {

    const { pricepoolid } = req.body

    if(!pricepoolid){
        return res.status(400).json({ message: "failed", data: "All fields are required"})
    }

    const pricepool = await Pricepool.findById(pricepoolid)
    if(!pricepool){
        return res.status(400).json({ message: "failed", data: "Pricepool not found"})
    }

    const { tiers, currentvalue, pricepool: total } = pricepool;

    console.log(currentvalue, total)
    if(currentvalue < total){
        return res.status(400).json({ message: "failed", data: "Current value is less than total pricepool." })
    }

    let formattedTiers = "";
    if (tiers.length > 1) {
        formattedTiers = tiers.slice(0, -1).join(", ") + " & " + tiers[tiers.length - 1];
    } else if (tiers.length === 1) {
        formattedTiers = tiers[0];
    } else {
        formattedTiers = "No tiers available";
    }

    const totalusers = await Inventory.find({
        type: { $in: tiers }, 
    }).select("owner -_id");
    
    
    if(!totalusers){
        return res.status(400).json({ message: "failed", data: "No users found in the tiers." })
    }
    const uniqueOwners = [...new Set(totalusers.map(user => user.owner))];

    const distribution = currentvalue / uniqueOwners.length;
    
    await PricepoolHistory.create({
        pricepool: pricepoolid,
        Benificiary: formattedTiers,
        total: currentvalue,
        totalusers: uniqueOwners.length,
        distribution
    })
    .catch(err => {
        console.log(`There's a problem encoutered while creating price pool history in distribute pricepool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })
    
    await Promise.all(
        uniqueOwners.map(async (owner) => {
            return Userwallets.updateOne(
                { owner, type: "creditwallet" },
                { $inc: { amount: distribution } }
            );
        })
    )
    .catch(err => {
        console.log(`There's a problem encoutered while distributing price pool in distribute pricepool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })
    
    await Pricepool.findOneAndUpdate({ _id: pricepoolid }, { $set: { status: "completed" } })
    .catch(err => {
        console.log(`There's a problem encoutered while updating price pool in distribute pricepool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })

    await Pricepool.create({
        currentvalue: 0,
        pricepool: 0,
        status: "current",
        tiers: []
    })
    .catch(err => {
        console.log(`There's a problem encoutered while creating price pool in distribute pricepool. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })

    return res.status(200).json({ message: "success" })
} 


exports.getdistributionhistory = async (req, res) => {
    const { page, limit } = req.query;

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        sort: { createdAt: -1 }
    }

    const totalRecords = await PricepoolHistory.countDocuments();

    const totalPages = Math.ceil(totalRecords / options.limit);

    await PricepoolHistory.find()
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort(options.sort)
    .then(data => {
        if(!data){
            return res.status(400).json({ message: "failed", data: "No price pool history data found."})
        }
        return res.status(200).json({ message: "success", data: data, totalPages: totalPages, totalRecords: totalRecords})
    })
    .catch(err => {
        console.log(`There's a problem encoutered while fetching price pool history. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact support for more details."})
    })
}