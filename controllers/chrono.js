const { default: mongoose } = require("mongoose")
const Inventoryhistory = require("../models/Inventoryhistory")
const Chrono = require("../models/Chrono")


exports.getchrono = async(req, res)=> {
 
    const chronos = await Chrono.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem fetching chronos. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })

    const data = []

    chronos.forEach(temp => {
        data.push({
            id: temp._id,
            name: temp.name,
            type: temp.type,
            min: temp.min,
            max: temp.max,
            duration: temp.duration,
            profit: temp.profit,
            isBuyonetakeone: temp.isBuyonetakeone
        })
    })
    return res.status(200).json({ message: "success", data: data})
}

// exports.getUserChrono = async(req, res)=> {
//     const { id, username } = req.user
//     const { type } = req.query

//     let value = true
//     if (type == "rolex_ai_bot"){
//         const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)
//         if(!tempchrono){
//             value = false
//         }
//     }

//     else if (type == "patek_philippe_ai_bot"){
//         const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)
//         const tempchrono1 = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)

//         if(!tempchrono || !tempchrono1){
//             value = false
//         }

//     } 
//     else if (type == "audemars_piguet_ai_bot"){

//         const tempchrono = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)
//         const tempchrono1 = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)
//         const tempchrono2 = await Inventoryhistory.findOne({owner: new mongoose.Types.ObjectId(id), chronotype: "", type: "Buy"})
//         .then(data => data)

//         if(!tempchrono || !tempchrono1 || !tempchrono2){
//             value = false
//         }
        
//     }

//     value = true


//     return res.status(200).json({ message: "success", data: value})
// }

exports.getUserChrono = async (req, res) => {
    const { id, username } = req.user;
    const { type } = req.query;

    try {
        let value = false;

        if (type === "rolex_ai_bot") {
            const rolexBots = await Inventoryhistory.find({
                owner: new mongoose.Types.ObjectId(id),
                chronotype: "rolex_ai_bot",
                type: "Buy"
            });

            if (rolexBots.length < 1) {
                value = false; 
            }
        } 

        else if (type === "patek_philippe_ai_bot") {
            const rolexBots = await Inventoryhistory.find({
                owner: new mongoose.Types.ObjectId(id),
                chronotype: "rolex_ai_bot",
                type: "Buy"
            });

            if (rolexBots.length > 0) {
                const patekBots = await Inventoryhistory.find({
                    owner: new mongoose.Types.ObjectId(id),
                    chronotype: "patek_philippe_ai_bot",
                    type: "Buy"
                });

                if (patekBots.length < 1) {
                    value = true;
                }
            }
        }

        else if (type === "audemars_piguet_ai_bot") {
            const rolexBots = await Inventoryhistory.find({
                owner: new mongoose.Types.ObjectId(id),
                chronotype: "rolex_ai_bot",
                type: "Buy"
            });

            if (rolexBots.length > 0) {
                const patekBots = await Inventoryhistory.find({
                    owner: new mongoose.Types.ObjectId(id),
                    chronotype: "patek_philippe_ai_bot",
                    type: "Buy"
                });

                if (patekBots.length > 0) {
                    const audemarsBots = await Inventoryhistory.find({
                        owner: new mongoose.Types.ObjectId(id),
                        chronotype: "audemars_piguet_ai_bot",
                        type: "Buy"
                    });

                    if (audemarsBots.length < 1) {
                        value = true;
                    }
                }
            }
        }

        return res.status(200).json({ message: "success", data: value });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



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