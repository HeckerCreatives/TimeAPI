const { default: mongoose } = require("mongoose");
const Wallethistory = require("../models/Wallethistory")

//  #region PLAYER

exports.playerwallethistory = async (req, res) => {
    const {id, username} = req.user
    const {type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    let wallethistorypipeline;
    
    if (type == "creditwallet"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "staffusers",
                    localField: "from",
                    foreignField: "_id",
                    as: "staffuserinfo"
                }
            },
            {
                $unwind: "$staffuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$staffuserinfo.username",
                    username: "$userinfo.username",
                    createdAt: 1
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }
    else{
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id), 
                    type: type
                }
            },
            {
                $sort: { "createdAt": -1 }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "fromuserinfo"
                }
            },
            {
                $unwind: "$fromuserinfo"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userinfo"
                }
            },
            {
                $unwind: "$userinfo"
            },
            {
                $project: {
                    type: 1,
                    amount: 1,
                    fromusername: "$fromuserinfo.username",
                    username: "$userinfo.username",
                    minername: 1,
                    createdAt: 1,
                }
            },
            {
                $skip: pageOptions.page * pageOptions.limit
            },
            {
                $limit: pageOptions.limit
            }
        ]
    }

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${id} error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, minername, createdAt} = historydata

        data.history.push({
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            minername: minername,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.getwallettotalearnings = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        mining: 0,
        referral: 0,
        unilevel: 0
    }

    const statisticGame = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "chronocoinwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of earning game for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of earning game. Please contact customer support."})
    })

    if (statisticGame.length > 0) {
        finaldata.mining = statisticGame[0].totalAmount;
    }

    const statisticReferral = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "directcommissionwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Referral for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Referral. Please contact customer support."})
    })

    if (statisticReferral.length > 0) {
        finaldata.referral = statisticReferral[0].totalAmount;
    }

    const statisticUnilevel = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "commissionwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Unilevel ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Unilevel. Please contact customer support."})
    })

    if (statisticUnilevel.length > 0) {
        finaldata.unilevel = statisticUnilevel[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}

//  #endregion

// #region ADMIN

exports.getwallettotalearningsforadmin = async (req, res) => {
    const {username} = req.user
    const {playerid: id} = req.query

    const finaldata = {
        mining: 0,
        referral: 0,
        unilevel: 0
    }

    const statisticGame = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "chronocoinwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of earning game for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of earning game. Please contact customer support."})
    })

    if (statisticGame.length > 0) {
        finaldata.mining = statisticGame[0].totalAmount;
    }

    const statisticReferral = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "directcommissionwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Referral for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Referral. Please contact customer support."})
    })

    if (statisticReferral.length > 0) {
        finaldata.referral = statisticReferral[0].totalAmount;
    }

    const statisticUnilevel = await Wallethistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: "commissionwallet" 
            } 
        },
        { 
            $group: { 
                _id: null, 
                totalAmount: { $sum: "$amount" } 
            } 
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the statistics of Unilevel ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of Unilevel. Please contact customer support."})
    })

    if (statisticUnilevel.length > 0) {
        finaldata.unilevel = statisticUnilevel[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}
