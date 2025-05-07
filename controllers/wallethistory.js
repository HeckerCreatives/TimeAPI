const { default: mongoose } = require("mongoose");
const Wallethistory = require("../models/Wallethistory");
const Userwallets = require("../models/Userwallets");

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

exports.getwalletstatistics = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        time: 0,
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
        finaldata.game = statisticGame[0].totalAmount;
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


exports.getwalletstatisticssuperadmin = async (req, res) => {
    const {id} = req.query

    const finaldata = {
        time: 0,
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
        finaldata.game = statisticGame[0].totalAmount;
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



exports.getplayerwallethistoryforadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, type, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    let wallettype
    
    let wallethistorypipeline

    if (type == "creditwallet"){
        wallettype = "creditwallet"
    }
    else if (type == "chronocoinwallet"){
        wallettype = "chronocoinwallet"
    }
    else if (type == "directwallet"){
        wallettype = "directcommissionwallet"
    }
    else if (type == "commissionwallet"){
        wallettype = "commissionwallet"
    }

    if (type == "creditwallet" || type == "chronocoinwallet"){
        wallethistorypipeline = [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: wallettype
                }
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
                    owner: new mongoose.Types.ObjectId(playerid), 
                    type: wallettype
                }
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

    const history = await Wallethistory.aggregate(wallethistorypipeline)
    .catch(err => {

        console.log(`Failed to get wallet history data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })
    
    const historypages = await Wallethistory.countDocuments({owner: new mongoose.Types.ObjectId(playerid), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet history count document data for ${username}, wallet type: ${type}, player: ${playerid} error: ${err}`)

        return res.status(401).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = Math.ceil(historypages / pageOptions.limit)

    const data = {
        history: [],
        pages: totalPages
    }

    history.forEach(historydata => {
        const {username, type, amount, fromusername, createdAt, _id} = historydata

        data.history.push({
            id: _id,
            username: username,
            type: type,
            amount: amount,
            fromusername: fromusername,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}


exports.editplayerwallethistoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { historyid, amount } = req.body;

    if (!historyid) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: "failed", data: "Amount cannot be negative." });
    }

    try {
        // Fetch the wallet history entry
        const history = await Wallethistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) });
        if (!history) {
            return res.status(400).json({ message: "failed", data: "Wallet history not found." });
        }

        let newwallettype 

        if (history.type === "creditwallet") {
            newwallettype = "creditwallet"
        } else if (history.type === "chronocoinwallet") {
            newwallettype = "chronocoinwallet"
        } else {
            newwallettype = "commissionwallet"
        }


        // get the current wallet balance of the user

        const wallet = await Userwallets.findOne({ owner: history.owner, type: newwallettype });
        if (!wallet) {
            return res.status(400).json({ message: "failed", data: "Wallet not found." });
        }


        // increment or decrement the wallet balance based on the new amount

        const difference = parseFloat(amount) - history.amount;
        const newwalletvalue = wallet.amount + difference;
        
        if (newwalletvalue < 0) {
            return res.status(400).json({ message: "failed", data: "Wallet balance cannot be negative." });
        }
        await Userwallets.findOneAndUpdate(
            { owner: history.owner, type: newwallettype },
            { $inc: { amount: difference } }
        )
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while updating ${historyid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })

        history.amount = parseFloat(amount);
        await history.save();


        return res.status(200).json({ message: "success" });
    } catch (err) {
        console.log(`Failed to edit wallet history for ${username}, history id: ${historyid}, Error: ${err}`);
        return res.status(500).json({ message: "failed", data: "An error occurred while editing the wallet history." });
    }
};

exports.createplayerwallethistoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { playerid, type, amount, user } = req.body;

    if (!playerid || !type) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    if (parseFloat(amount) < 0) {
        return res.status(400).json({ message: "failed", data: "Amount cannot be negative." });
    }

    try {
        
        const userfrom = await Users.findOne({ username: { $regex: new RegExp('^' + user + '$', 'i') } })

        if (!userfrom) {
            return res.status(400).json({ message: "failed", data: "User not found." });
        }

        const walletHistory = new Wallethistory({
            owner: new mongoose.Types.ObjectId(playerid),
            type: type,
            amount: parseFloat(amount),
            from: new mongoose.Types.ObjectId(userfrom._id),
        });

        await walletHistory.save();

        let newwallettype = type;
        if (type === "commissionwallet" || type === "directcommissionwallet") {
            newwallettype = "commissionwallet";
        }

        await Userwallets.findOneAndUpdate(
            { owner: playerid, type: newwallettype },
            { $inc: { amount: parseFloat(amount) } },
            { new: true }
        )
        .catch(err => {
            console.log(`Failed to update wallet for player ${playerid}, Error: ${err}`);
            return res.status(400).json({ message: "bad-request", data: "Failed to update wallet balance." });
        });

        return res.status(200).json({ message: "success" });
    } catch (err) {
        console.log(`Failed to create wallet history for ${username}, player: ${playerid}, Error: ${err}`);
        return res.status(500).json({ message: "failed", data: "An error occurred while creating the wallet history." });
    }
};

exports.deleteplayerwallethistoryforadmin = async (req, res) => {
    const { id, username } = req.user;
    const { historyid } = req.body;

    if (!historyid) {
        return res.status(400).json({ message: "failed", data: "Incomplete form data." });
    }

    try {
        // Fetch the wallet history entry
        const history = await Wallethistory.findOne({ _id: new mongoose.Types.ObjectId(historyid) });
        if (!history) {
            return res.status(400).json({ message: "failed", data: "Wallet history not found." });
        }

        let newwallettype 

        if (history.type === "fiatbalance") {
            newwallettype = "fiatbalance"
        } else if (history.type === "gamebalance") {
            newwallettype = "gamebalance"
        } else {
            newwallettype = "commissionwallet"
        }


        // get the current wallet balance of the user
        const wallet = await Userwallets.findOne({ owner: history.owner, type: newwallettype });
        if (!wallet) {
            return res.status(400).json({ message: "failed", data: "Wallet not found." });
        }

        // When deleting a history entry, we need to subtract the history amount from the wallet
        const newWalletBalance = wallet.amount - history.amount;

        if (newWalletBalance < 0) {
            return res.status(400).json({ message: "failed", data: "Wallet balance cannot be negative after deletion." });
        }

        await Userwallets.findOneAndUpdate(
            { owner: history.owner, type: newwallettype },
            { $set: { amount: newWalletBalance } }
        )
        .catch(err => {
            console.log(`There's a problem encountered while updating wallet for history deletion ${historyid}. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })


        // delete the wallet history entry

        await Wallethistory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(historyid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem encountered while deleting ${historyid} wallet history. Error: ${err}`)
            return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
        })

        return res.status(200).json({ message: "success" });
    } catch (err) {
        console.log(`Failed to delete wallet history for ${username}, history id: ${historyid}, Error: ${err}`);
        return res.status(500).json({ message: "failed", data: "An error occurred while deleting the wallet history." });
    }
};
