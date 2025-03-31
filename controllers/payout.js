const { default: mongoose } = require("mongoose")
const Payout = require("../models/Payout")
const Userwallets = require("../models/Userwallets")
const StaffUserwallets = require("../models/Staffuserwallet")
const Maintenance = require("../models/Maintenance")
const { addwallethistory } = require("../utils/wallethistorytools")
const { addanalytics } = require("../utils/analyticstools")
const { FormatDate } = require("../utils/datetimetools")

//  #region USER

exports.requestpayout = async (req, res) => {
    const { id, username } = req.user;
    const { type, payoutvalue, paymentmethod, accountname, accountnumber } = req.body;

    if (payoutvalue < 500) {
        return res.status(400).json({ message: "failed", data: "Minimum cashout is ₱500" });
    }

    if (paymentmethod.toLowerCase() === "gcash" && payoutvalue > 5000) {
        return res.status(400).json({ message: "failed", data: "Gcash pay out maximum value is ₱5000." });
    }


    if (paymentmethod.toLowerCase() === "gotyme" && payoutvalue < 0) {
        return res.status(400).json({ message: "failed", data: "GoTyme pay out minimum value is ₱0." });
    }


    const maintenances = await Maintenance.findOne({ type: "payout" }).then((data) => data);

     if (maintenances.value == "1") {
         return res.status(400).json({ message: "failed", data: "Request payout is only available during friday." });
     }

    const exist = await Payout.find({
        owner: new mongoose.Types.ObjectId(id),
        type: type,
        status: "processing"
    }).then((data) => data);

    if (exist.length > 0) {
        return res.status(400).json({
            message: "failed",
            data: "There's an existing request! Please wait for it to be processed before requesting another payout."
        });
    }

    const wallet = await Userwallets.findOne({ owner: new mongoose.Types.ObjectId(id), type: type })
        .then((data) => data)
        .catch((err) => {
            console.log(`There's a problem getting leaderboard data ${err}`);
            return res.status(400).json({
                message: "bad-request",
                data: "There's a problem with the server! Please contact customer support for more details."
            });
        });

    if (payoutvalue > wallet.amount) {
        return res.status(400).json({
            message: "failed",
            data: "The amount is greater than your wallet balance"
        });
    }

    await Userwallets.findOneAndUpdate(
        { owner: new mongoose.Types.ObjectId(id), type: type },
        { $inc: { amount: -payoutvalue } }
    ).catch((err) => {
        console.log(`There's a problem deducting payout value for ${username} with value ${payoutvalue}. Error: ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem with the server! Please contact customer support for more details."
        });
    });

    await Payout.create({
        owner: new mongoose.Types.ObjectId(id),
        status: "processing",
        value: payoutvalue,
        type: type,
        paymentmethod: paymentmethod,
        accountname: accountname,
        accountnumber: accountnumber
    }).catch(async (err) => {
        await Userwallets.findOneAndUpdate(
            { owner: new mongoose.Types.ObjectId(id), type: type },
            { $inc: { amount: payoutvalue } }
        ).catch((err) => {
            console.log(`There's a problem getting leaderboard data ${err}`);
            return res.status(400).json({
                message: "bad-request",
                data: "There's a problem with the server! Please contact customer support for more details."
            });
        });

        console.log(`There's a problem getting leaderboard data ${err}`);
        return res.status(400).json({
            message: "bad-request",
            data: "There's a problem with the server! Please contact customer support for more details."
        });
    });

    return res.json({ message: "success" });
};
exports.getrequesthistoryplayer = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payouthistory = await Payout.find({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting leaderboard data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    const totalPages = await Payout.countDocuments({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        totalPages: pages,
        history: []
    }

    payouthistory.forEach(valuedata => {
        const {owner, processby, status, value, type, createdAt, updatedAt} = valuedata

        data.history.push({
            date: createdAt,
            grossamount: value,
            withdrawalfee: value * 0.10,
            netammount: value - (value * 0.10),
            status: status == "processing" ? "In review" : status == "done" ? `Approved (${FormatDate(updatedAt)})` : `Rejected (${FormatDate(updatedAt)})`
        })
    })

    return res.json({message: "success", data: data})
}

//  #endregion

//  #region SUPERADMIN

exports.getpayoutlist = async (req, res) => {
    const { id, username } = req.user;
    const { methodtype, date, type, page, limit, searchUsername } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const payoutpipelinelist = [
        {
            $match: {
                status: "processing",
                type: type
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerinfo"
            }
        },
        {
            $unwind: "$ownerinfo"
        },
        {
            $lookup: {
                from: "userdetails",
                localField: "owner",
                foreignField: "owner",
                as: "userdetails"
            }
        },
        {
            $unwind: "$userdetails"
        }
    ];

    // Conditionally add $match stage for username if searchUsername is provided
    if (searchUsername) {
        payoutpipelinelist.push({
            $match: {
                "ownerinfo.username": { $regex: new RegExp(searchUsername, 'i') }
            }
        });
    }

    if (date) {
        payoutpipelinelist.splice(1, 0, {
            $match: {
                createdAt: {
                    $gte: new Date(date + "T00:00:00Z"),
                    $lt: new Date(new Date(date + "T00:00:00Z").getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });
    }

    if (methodtype) {
        payoutpipelinelist.splice(1, 0, {
            $match: {
                "paymentmethod": methodtype
            }
        });
    }

    payoutpipelinelist.push({
        $sort: {
            createdAt: -1
        }
    })

    payoutpipelinelist.push(
        {
            $facet: {
                totalPages: [
                    { $count: "count" }
                ],
                data: [
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            value: 1,
                            type: 1,
                            username: "$ownerinfo.username",
                            userid: "$ownerinfo._id",
                            firstname: "$userdetails.firstname",
                            lastname: "$userdetails.lastname",
                            phonenumber: "$userdetails.phonenumber",
                            paymentmethod: 1,
                            accountnumber: 1,
                            accountname: 1,
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
        }
    );

    try {
        const payoutlistResult = await Payout.aggregate(payoutpipelinelist);

        console.log(payoutlistResult[0].data)

        const totalPages = payoutlistResult[0].totalPages[0]?.count || 0;
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            payoutlist: [],
            totalPages: pages
        };

        payoutlistResult[0].data.forEach(valuedata => {
            const { _id, owner, status, value, type, username, firstname, lastname, accountnumber, accountname, paymentmethod, userid, createdAt, phonenumber } = valuedata;

            data.payoutlist.push({
                id: _id,
                owner: owner,
                username: username,
                userid: userid,
                firstname: firstname,
                lastname: lastname,
                paymentmethod: paymentmethod,
                accountnumber: accountnumber,
                accountname: accountname,
                grossamount: value,
                withdrawalfee: value * 0.10,
                netamount: value - (value * 0.10),
                status: status == "processing" ? "In Review" : status,
                type: type,
                createdAt: createdAt,
                phonenumber: phonenumber
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`Error processing payout list for ${username}, error: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem processing your request. Please contact customer support." });
    }
}

exports.getpayouthistorysuperadmin = async (req, res) => {
    const { id, username } = req.user;
    const { type, page, limit, searchUsername } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const payoutpipelinelist = [
        {
            $match: {
                $or: [{status: "done"}, {status: "reject"}],
                type: type
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerinfo"
            }
        },
        {
            $unwind: "$ownerinfo"
        },
        {
            $lookup: {
                from: "userdetails",
                localField: "owner",
                foreignField: "owner",
                as: "userdetails"
            }
        },
        {
            $unwind: "$userdetails"
        }
    ];

    // Conditionally add $match stage for username if searchUsername is provided
    if (searchUsername) {
        payoutpipelinelist.push({
            $match: {
                "ownerinfo.username": { $regex: new RegExp(searchUsername, 'i') }
            }
        });
    }

      payoutpipelinelist.push({
        $sort: {
            updatedAt: -1
        }
    })

    payoutpipelinelist.push(
        {
            $facet: {
                totalPages: [
                    { $count: "count" }
                ],
                data: [
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            value: 1,
                            type: 1,
                            userid: "$ownerinfo._id",
                            username: "$ownerinfo.username",
                            firstname: "$ownerinfo.firstname",
                            lastname: "$ownerinfo.lastname",
                            paymentmethod: 1,
                            phonenumber: "$userdetails.phonenumber",
                            accountnumber: 1,
                            accountname: 1,
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
        }
    );

    try {
        const payoutlistResult = await Payout.aggregate(payoutpipelinelist);

        console.log(payoutlistResult)

        const totalPages = payoutlistResult[0].totalPages[0]?.count || 0;
        const pages = Math.ceil(totalPages / pageOptions.limit);

        const data = {
            payoutlist: [],
            totalPages: pages
        };

        payoutlistResult[0].data.forEach(valuedata => {
            const { _id, owner, status, value, type, username, firstname, lastname, accountnumber, accountname, paymentmethod, userid, createdAt, phonenumber } = valuedata;

            data.payoutlist.push({
                createdAt: createdAt,
                id: _id,
                owner: owner,
                username: username,
                userid: userid,
                firstname: firstname,
                lastname: lastname,
                paymentmethod: paymentmethod,
                accountnumber: accountnumber,
                accountname: accountname,
                grossamount: value,
                withdrawalfee: value * 0.10,
                netamount: value - (value * 0.10),
                status: status == "processing" ? "In Review" : status,
                type: type,
                phonenumber: phonenumber
            });
        });

        return res.json({ message: "success", data: data });
    } catch (err) {
        console.log(`Error processing payout list for ${username}, error: ${err}`);
        return res.status(400).json({ message: "bad-request", data: "There's a problem processing your request. Please contact customer support." });
    }
}

exports.processpayout = async (req, res) => {
    const {id, username} = req.user
    const {payoutid, status} = req.body

    let payoutvalue = 0
    let playerid = ""
    let wallettype = ""

    const payoutdata = await Payout.findOne({_id: new mongoose.Types.ObjectId(payoutid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payout data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (payoutdata.status != "processing"){
        return res.status(400).json({ message: 'failed', data: `You already processed this payout` })
    }

    await Payout.findOneAndUpdate({_id: new mongoose.Types.ObjectId(payoutid)}, {status: status, processby: new mongoose.Types.ObjectId(id)}, {new: true})
    .then(data => {
        payoutvalue = data.value
        playerid = data.owner._id
        wallettype = data.type
    })
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (status == "reject"){
        await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(playerid), type: wallettype}, {$inc: {amount: payoutvalue}})
        .catch(err => {

            console.log(`Failed to process Payout data for ${username}, player: ${playerid}, payinid: ${payinid} error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
    }
    else{

        const adminfee = payoutvalue * 0.1

        await StaffUserwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {$inc: {amount: adminfee}})

        const analyticsadd = await addanalytics(playerid, "", `payout${wallettype}`, `Payout to user ${playerid} with a value of ${payoutvalue} and admin fee of ${adminfee} processed by ${username}`, payoutvalue)

        if (analyticsadd != "success"){
            return res.status(400).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
        }
    }

    return res.json({message: "success"})
}

exports.deletepayout = async (req, res) => {
    const {id, username} = req.user
    const {payoutid} = req.body

    let payoutvalue = 0

    const payoutdata = await Payout.findOne({_id: new mongoose.Types.ObjectId(payoutid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get Payout data for ${payoutid}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (!payoutdata){
        return res.status(400).json({message: "failed", data: "Please select a valid payout request!"})
    }

    await Payout.findOneAndDelete({_id: new mongoose.Types.ObjectId(payoutid)})
    .catch(err => {

        console.log(`Failed to delete Payout data for ${payoutid}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    console.log(`Payout request id: ${payoutdata._id}  owner: ${payoutdata.owner}  type: ${payoutdata.type}  amount: ${payoutdata.value}`)

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(payoutdata.owner), type: payoutdata.type}, {$inc: {amount: payoutdata.value}})
    .catch(err => {

        console.log(`Failed to update userwallet data for ${payoutdata.owner} with value ${payoutdata.value}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    return res.json({message: "success"})
}

exports.gettotalrequest = async (req, res) => {
    const commissionBalanceTotal = await Payout.aggregate([
        {
            $match: {
                type: "commissionwallet",
                status: "processing"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$value" }
            }
        }
    ]);

    const mineCoinTotal = await Payout.aggregate([
        {
            $match: {
                type: "chronocoinwallet",
                status: "processing"
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$value" }
            }
        }
    ]);

    return res.json({message: "success", data: {
        totalrequestcommission: commissionBalanceTotal.length > 0 ? (commissionBalanceTotal[0].totalAmount - (commissionBalanceTotal[0].totalAmount * 0.10)) : 0,
        totalrequestminecoin: mineCoinTotal.length > 0 ? (mineCoinTotal[0].totalAmount - (mineCoinTotal[0].totalAmount * 0.10)) : 0
    }})
}

exports.getrequesthistoryplayerforsuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {page, limit, userid} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payouthistory = await Payout.find({owner: new mongoose.Types.ObjectId(userid)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting leaderboard data ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details." })
    })

    const totalPages = await Payout.countDocuments({owner: new mongoose.Types.ObjectId(userid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        totalPages: pages,
        history: []
    }

    payouthistory.forEach(valuedata => {
        const {owner, processby, status, value, type, createdAt, updatedAt} = valuedata

        data.history.push({
            date: createdAt,
            grossamount: value,
            withdrawalfee: value * 0.10,
            netammount: value - (value * 0.10),
            status: status == "processing" ? "In review" : status == "done" ? `Approved (${FormatDate(updatedAt)})` : `Rejected (${FormatDate(updatedAt)})`
        })
    })

    return res.json({message: "success", data: data})
}

//  #endregion