const { default: mongoose } = require("mongoose")
const Analytics = require("../models/Analytics")
const Userwallets = require("../models/Userwallets")
const Users = require("../models/Users")
const Payin = require("../models/Payin")
const Payout = require("../models/Payout")
const Staffusers = require("../models/Staffusers")
const StaffUserwallets = require("../models/Staffuserwallet")
const bcrypt = require('bcrypt');

exports.getsadashboard = async(req, res) => {
    const {id, username} = req.user

    const data = {}

    const commissiontotalpipeline = [
        {
            $match: {
                $or: [{type: "directcommissionwallet"}, {type: "commissionwallet"}]
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const commission = await Analytics.aggregate(commissiontotalpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["totalusercommission"] = commission.length > 0 ? commission[0].totalAmount : 0

    const productspipeline = [
        {
            $match: {
                $or: [{type: "Buy Rolex AI Bot buy one take one"}, {type: "Buy Patek Philippe AI Bot buy one take one"}, {type: "Buy Audemars Piguet AI Bot buy one take one"},{type: "Buy Rolex AI Bot"}, {type: "Buy Patek Philippe AI Bot"}, {type: "Buy Audemars Piguet AI Bot"}]
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const products = await Analytics.aggregate(productspipeline)
    .catch(err => {

        console.log(`There's a problem getting commission aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["chronoprofit"] = products.length > 0 ? products[0].totalAmount : 0

    const commissioned = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(process.env.ADMIN_ID), type: "commissionwallet"})
    .then(data => data.amount)
    .catch(err => {

        console.log(`There's a problem getting commissioned for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })
    
    data["companycommission"] = commissioned

    const usercount = await Users.countDocuments({username: { $ne: "minergod"}})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user count for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["registered"] = usercount

    const payinpipline = [
        {
            $match: {
                type: "payincreditwallet"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payin = await Analytics.aggregate(payinpipline)
    .catch(err => {

        console.log(`There's a problem getting payin aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["payin"] = payin.length > 0 ? payin[0].totalAmount : 0

    const payoutgamepipeline = [
        {
            $match: {
                type: "payoutchronocoinwallet"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payoutgame = await Analytics.aggregate(payoutgamepipeline)
    .catch(err => {

        console.log(`There's a problem getting payout game aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["payoutminer"] = payoutgame.length > 0 ? payoutgame[0].totalAmount : 0

    const payoutcommissionpipeline = [
        {
            $match: {
                type: "payoutcommissionwallet"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]
    const payoutcommission = await Analytics.aggregate(payoutcommissionpipeline)
    .catch(err => {

        console.log(`There's a problem getting payout commission aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })
    
    data["payoutcommission"] = payoutcommission.length > 0 ? payoutcommission[0].totalAmount : 0

    data["totalpayout"] = parseFloat(data["payoutminer"]) + parseFloat(data["payoutcommission"])
    
    return res.json({message: "success", data: data})
}

exports.banunbanuser = async (req, res) => {
    const {id, username} = req.user
    const {status, staffusername} = req.body

    await Staffusers.findOneAndUpdate({username: staffusername}, {status: status})
    .catch(err => {

        console.log(`There's a problem banning or unbanning user for ${username}, player: ${staffusername}, status: ${status} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.multiplebanstaffusers = async (req, res) => {
    const {id, username} = req.user;
    const {staffuserlist, status} = req.body

    const data = [];

    staffuserlist.forEach(tempdata => {
        data.push({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(tempdata) },
                update: { status: status }
            }
        })
    })

    console.log(data)

    if (data.length <= 0){
        return res.json({message: "success"})
    }

    await Staffusers.bulkWrite(data)
    .catch(err => {
        console.log(`There's a problem setting status to ${status} to the users. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: `There's a problem setting status to ${status} to the users`})
    })

    return res.json({message: "success"})
}

exports.updateadmin = async (req, res) => {
    const {id, username} = req.user
    const {adminid, password} = req.body

    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Staffusers.findOneAndUpdate({_id: new mongoose.Types.ObjectId(adminid)}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem updating user data for ${adminid}, admin execution: ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.getadmindashboard = async (req, res) => {
    const {id, username} = req.user

    const data = {}

    const payinpipeline = [
        {
            $match: {
                processby: new mongoose.Types.ObjectId(id),
                status: "done"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const payin = await Payin.aggregate(payinpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["totalpayin"] = payin.length > 0 ? payin[0].totalAmount : 0

    const payoutpipeline = [
        {
            $match: {
                processby: new mongoose.Types.ObjectId(id),
                status: "done"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]

    const payout = await Payout.aggregate(payoutpipeline)
    .catch(err => {

        console.log(`There's a problem getting commission and buy aggregate for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["totalpayout"] = payout.length > 0 ? payout[0].totalAmount : 0

    
    const adminfee = await StaffUserwallets.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting admin fee wallet for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: `There's a problem with the server. Please try again later. Error: ${err}` })
    })

    data["adminfeewallet"] = adminfee.amount;

    return res.json({message: "success", data: data})
}

exports.changepass = async (req, res) => {
    const {id, username} = req.user
    const {password} = req.body

    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Staffusers.findOneAndUpdate({username: username}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem updating user data for ${username}, admin execution: ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.searchadminlist = async (req, res) => {
    const {id, username} = req.user
    const {adminusername, status, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const adminlistsearch = {
        auth: {$ne: "superadmin"}
    }

    if (adminusername){
        adminlistsearch["username"] = { $regex: new RegExp(adminusername, 'i') }
    }

    if (status){
        adminlistsearch["status"] = status
    }

    const adminlist = await Staffusers.find(adminlistsearch)
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({createdAt: -1})
    .catch(err => {
        console.log(`Failed to get admin list data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Staffusers.countDocuments(adminlistsearch)
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents staff users data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        users: [],
        totalPages: pages
    }

    adminlist.forEach(value => {
        const {_id, username, status, createdAt} = value

        data["users"].push(
            {
                userid: _id,
                username: username,
                status: status,
                createdAt: createdAt
            }
        )
    });

    return res.json({message: "success", data: data})
}