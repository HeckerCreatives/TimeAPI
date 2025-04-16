const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")

//  #region USER

exports.playerwallets = async (req, res) => {
    const { id } = req.user

    const wallets = await Userwallets.find({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get dashboard wallet data for ${data.owner}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const data = {}

    wallets.forEach(datawallet => {
        const {type, amount} = datawallet

        data[type] = amount
    })

    return res.json({message: "success", data: data})
}

//  #endregion

//  #region ADMIN

exports.getplayerwalletforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid} = req.query

    const playerwallet = await Userwallets.find({owner: new mongoose.Types.ObjectId(playerid)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        userwallets: {}
    }

    playerwallet.forEach(value => {
        const {type, amount} = value

        data.userwallets[type] = {
            amount: amount
        }
    })

    return res.json({message: "success", data: data})
}

exports.editplayerwalletforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, type, amount} = req.body

    
    const playerwallet = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(playerid), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })


    if (!playerwallet) {
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    }
    if (type === "commissionwallet") {
        return res.status(400).json({ message: "bad-request", data: "You can't edit commission wallet." })
    }

    if (amount < 0) {
        return res.status(400).json({ message: "bad-request", data: "You can't set the amount to negative value." })
    }

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(playerid), type: type}, {amount: amount})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem updating user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    // get commision wallet and always set it to unilevel wallet + direct wallet

    const playercommision = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(playerid), type: "commissionwallet"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })
    const playerunilevel = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(playerid), type: "unilevelwallet"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })
    const playerdirect = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(playerid), type: "directwallet"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting user wallet for ${username}, player: ${playerid}, Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const playerunilevelamount = playerunilevel.amount
    const playerdirectamount = playerdirect.amount
    
    const playercommisionamount = playerunilevelamount + playerdirectamount

    playercommision.amount = playercommisionamount
    await playercommision.save()

    return res.json({message: "success"})
}

//  #endregion