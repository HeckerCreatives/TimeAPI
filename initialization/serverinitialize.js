const { default: mongoose } = require("mongoose")
const Users = require("../models/Users")
const Staffusers = require("../models/Staffusers")
const Userwallets = require("../models/Userwallets")
const Userdetails = require("../models/Userdetails")
const Maintenance = require("../models/Maintenance")
const Pricepool = require("../models/Pricepool")
const Chrono = require("../models/Chrono")

exports.initialize = async (req, res) => {

    //  INITIALIZE CREATURE SMASH USER
    const csadmin = await Users.findOne({username: "chronogod"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting cs user data ${err}`)
        return
    })

    if (!csadmin){
        const player = await Users.create({_id: new mongoose.Types.ObjectId(process.env.ADMIN_ID), username: "chronogod", password: "aQOFJAd3klK412", gametoken: "", webtoken: "", bandate: "none", banreason: "", status: "active"})
        
        await Userdetails.create({owner: new mongoose.Types.ObjectId(player._id), phonenumber: "", fistname: "", lastname: "", address: "", city: "", country: "", postalcode: "", profilepicture: ""})
        .catch(async err => {

            await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

            console.log(`Server Initialization Failed, Error: ${err}`);

            return
        })
    
        const wallets = ["creditwallet", "chronocoinwallet", "commissionwallet"]

        wallets.forEach(async (data) => {
            await Userwallets.create({owner: new mongoose.Types.ObjectId(player._id), type: data, amount: 0})
            .catch(async err => {

                await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

                await Userdetails.findOneAndDelete({_id: new mongoose.Types.ObjectId(player._id)})

                console.log(`Server Initialization Failed, Error: ${err}`);
    
                return
            })
        })
    }

    const staff = await Staffusers.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting staff user data ${err}`)
        return
    })

    if (staff.length <= 0){
        await Staffusers.create({_id: new mongoose.Types.ObjectId(process.env.ADMIN_ID), username: "chronogodadmin", password: "aQOFJAd3klK412", webtoken: "", status: "active", auth: "superadmin"})
        .catch(err => {
            console.log(`There's a problem creating staff user data ${err}`)
            return
        })
    }

    const pricepool = await Pricepool.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting price pool data ${err}`)
        return
    })

    if (pricepool.length <= 0){
        await Pricepool.create({ currentvalue: 0, pricepool: 0, status: "current"})
        .catch(err => {
            console.log(`There's a problem creating staff user data ${err}`)
            return
        })
        console.log('Price Pool Initialized.')
    }
    const maintenances = await Maintenance.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting maintenance data ${err}`)
        return
    })

    const mainte = [{ insertOne: { type: "b1t1", value: "0" }},  { insertOne: { type: "payout", value: "1" } }]

    if (maintenances.length <= 0){
        await Maintenance.bulkWrite(mainte)
    }

    const Chronos = await Chrono.find()
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting chrono data ${err}`)
        return
    })

    if(Chronos.length <= 0){
        const Chronoz = [
            {
                    type: "rolex_ai_bot",
                    name: "Rolex AI Bot",
                    profit: 0.10,
                    duration: 5,
                    min: 500,
                    max: 5000
            },
            {
                    type: "patek_philippe_ai_bot",
                    name: "Patek Philippe AI Bot",
                    profit: 0.25,
                    duration: 10,
                    min: 1000,
                    max: 10000
            },
            {
                    type: "audemars_piguet_ai_bot",
                    name: "Audemars Piguet AI Bot",
                    profit: 0.60,
                    duration: 20,
                    min: 2000,
                    max: 20000
            }
        ];

        await Chrono.bulkWrite(
            Chronoz.map((Chrono) => ({
                insertOne: { document: Chrono },
            }))
        )
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem creating chrono data ${err}`)
            return
        })
    }

            

    console.log("Server Initialization Success")
}