const { default: mongoose } = require("mongoose")
const Inventoryhistory = require("../models/Inventoryhistory")
const Inventory = require("../models/Inventory")
const Chrono = require("../models/Chrono")


exports.getchrono = async(req, res)=> {

    const {id} = req.user
 
    const chronos = await Chrono.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem fetching chronos. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })


    const history = await Inventoryhistory.find({
        owner: new mongoose.Types.ObjectId(id),
        chronotype: { $in: ["rolex_ai_bot", "patek_philippe_ai_bot", "audemars_piguet_ai_bot"] }
    }); // Limit to 3 items only


    const purchased = await Inventory.find({
        owner: new mongoose.Types.ObjectId(id),
        type: { $in: ["rolex_ai_bot", "patek_philippe_ai_bot", "audemars_piguet_ai_bot"] },
        promo: { $ne: "Free" }
    })

    const totalpurchased = purchased.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + entry.price;
        return acc;
    }, {});

    const purchasedTypes = new Set(history.map(entry => entry.chronotype));

    const data = []

    chronos.forEach(temp => {
        let canbuy = false;
        let isunlock = false;
        let totalleft = temp.max;
        
        if (temp.type === "rolex_ai_bot") {
            isunlock = true;
            if (totalpurchased["rolex_ai_bot"]){
                totalleft = temp.max - totalpurchased["rolex_ai_bot"]
            }
        }
        else if (temp.type == "patek_philippe_ai_bot"){
            if (purchasedTypes.has("rolex_ai_bot")){
                isunlock = true;
            }

            if (totalpurchased["patek_philippe_ai_bot"]){
                totalleft = temp.max - totalpurchased["patek_philippe_ai_bot"]
            }

        }
        else if (temp.type == "audemars_piguet_ai_bot"){
            if (purchasedTypes.has("patek_philippe_ai_bot")){
                isunlock = true;
            }
            if (totalpurchased["audemars_piguet_ai_bot"]){
                totalleft = temp.max - totalpurchased["audemars_piguet_ai_bot"]
            }
        }

        if (totalleft > 0){
            canbuy = true;
        }

        data.push({
            id: temp._id,
            name: temp.name,
            type: temp.type,
            min: temp.min,
            max: temp.max,
            duration: temp.duration,
            profit: temp.profit,
            isBuyonetakeone: temp.isBuyonetakeone,
            canbuy: canbuy,
            isunlock: isunlock,
            totalleft: totalleft
        })
    })

    const sortorder = {
        "rolex_ai_bot": 1,
        "patek_philippe_ai_bot": 2,
        "audemars_piguet_ai_bot": 3
    };
    
    data.sort((a, b) => sortorder[a.type] - sortorder[b.type]);
    return res.status(200).json({ message: "success", data: data})
}

exports.getUserChrono = async(req, res)=> {
    const { id, username } = req.user
    const { type } = req.query

    let value = true
    if (type == "rolex_ai_bot"){
        const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "rolex_ai_bot", type: "Buy"})
        .then(data => data)
        if(!tempchrono){
            value = false
        }
    }

    else if (type == "patek_philippe_ai_bot"){
        const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "rolex_ai_bot", type: "Buy"})
        .then(data => data)

        value = tempchrono
    } 
    else if (type == "audemars_piguet_ai_bot"){

        const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "rolex_ai_bot", type: "Buy"})
        .then(data => data)
        const tempchrono1 = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "patek_philippe_ai_bot", type: "Buy"})
        .then(data => data)

        if(!tempchrono || !tempchrono1){
            value = false
        }
        
    }

    // value = true


    return res.status(200).json({ message: "success", data: value})
}

exports.editchrono = async (req, res) => {

    const { chronoid, duration, min, max, profit, isBuyonetakeone } = req.body

    if(!chronoid){
        return res.status(400).json({ message: "failed", data: "Incomplete form data."})
    }

    await Chrono.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(chronoid)
        },
        {
            $set: {
                duration: parseFloat(duration),
                profit: parseFloat(profit),
                min: parseFloat(min),
                max: parseFloat(max),
                isBuyonetakeone: isBuyonetakeone
            }
        }
    )
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem encountered while updating ${chronoid} chrono. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    return res.status(200).json({ message: "success" })
}