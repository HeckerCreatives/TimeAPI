const { default: mongoose } = require("mongoose")
const Payin = require("../models/Payin")
const Userwallets = require("../models/Userwallets")
const Users = require("../models/Users")
const { addwallethistory } = require("../utils/wallethistorytools")
const { addanalytics, deleteanalytics } = require("../utils/analyticstools")
const { createpayin } = require("../utils/payintools")
const {checktwentyfourhours} = require("../utils/datetimetools")

//  #region USER

exports.getpayinhistoryplayer = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinhistory = await Payin.find({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get payin list data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Payin.countDocuments({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinhistory: [],
        totalPages: pages
    }
    
    payinhistory.forEach(valuedata => {
        const {owner, processby, status, value, createdAt} = valuedata

        data.payinhistory.push({
            owner: owner.username,
            processby: processby != null ? processby.username : "",
            status: status,
            value: value,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

//  #endregion

//  #region SUPERADMIN

exports.sendfiattoplayer = async (req, res) => {
    const {id, username} = req.user
    const {playerusername, amount} = req.body

    const player = await Users.findOne({username: playerusername})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get player data for ${username}, player: ${playerusername} error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    if (!player){
        return res.status(400).json({ message: 'failed', data: `The account does not exist! Please enter the correct username` })
    }

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(player._id), type: "creditwallet"}, {$inc: {amount: amount}})
    .catch(err => {

        console.log(`Failed to add wallet fiat player data for ${username}, player: ${playerusername}, amount: ${amount}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const addpayin = await createpayin(player._id, amount, id, "done")

    if (addpayin["message"] == null){
        return res.status(400).json({ message: 'failed1', data: `There's a problem creating payin in wallet history. Please contact customer support for more details` })
    }
    else if (addpayin["message"] != "success"){
        return res.status(400).json({ message: 'failed2', data: `There's a problem creating payin in wallet history. Please contact customer support for more details` })
    }
    
    const wallethistoryadd = await addwallethistory(player._id, "creditwallet", amount, id, "")

    if (wallethistoryadd.message != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem saving payin in wallet history. Please contact customer support for more details` })
    }

    const analyticsadd = await addanalytics(player._id, addpayin.data._id, "payincreditwallet", `Add balance to user ${player._id} with a value of ${amount} processed by ${username}`, amount)

    if (analyticsadd != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem saving payin in analytics history. Please contact customer support for more details` })
    }

    return res.json({message: "success"})
}

exports.deletepayinplayersuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {transactionid, userid} = req.body

    const transaction = await Payin.findOne({_id: new mongoose.Types.ObjectId(transactionid), status: "done"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the transaction ${transactionid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the transaction. Please contact customer support!"})
    })

    if (!transaction){
        return res.status(400).json({message: "failed", data: "No transaction is found! Please select a valid transaction"})
    }

    await Payin.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(transactionid)}, {status: "deleted"})
    .catch(err => {
        console.log(`There's a problem getting the changing the transaction ${transactionid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem changing the transaction Please contact customer support!"})
    })

    await deleteanalytics(transaction._id)

    return res.json({message: "success"})
}

exports.getpayinhistorysuperadmin = async (req, res) => {
    const { id, username } = req.user;
    const { page, limit, searchUsername } = req.query;

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const payinpipelinelist = [
        {
            $match: {
                status: { $in: ["done", "reject"] }  // Using $in is more concise for this case
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
        { $unwind: "$ownerinfo" },
        {
            $lookup: {
                from: "userdetails",
                localField: "owner",
                foreignField: "owner",
                as: "userdetails"
            }
        },
        { $unwind: "$userdetails" }
    ];
    
    // Conditionally add $match stage for username if searchUsername is provided
    if (searchUsername) {
        payinpipelinelist.push({
            $match: {
                "ownerinfo.username": { $regex: new RegExp(searchUsername, 'i') }
            }
        });
    }
    
    // Sort by createdAt before pagination
    payinpipelinelist.push({ $sort: { createdAt: -1 } });
    
    // Add $facet to perform pagination and count
    payinpipelinelist.push({
        $facet: {
            totalPages: [{ $count: "count" }],
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
                        createdAt: 1
                    }
                },
                { $skip: pageOptions.page * pageOptions.limit },
                { $limit: pageOptions.limit }
            ]
        }
    });

    
    const payinhistory = await Payin.aggregate(payinpipelinelist)
    .catch(err => {
        console.log(`Failed to get payin list data for ${username}, error: ${err}`);
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` });
    });

    const totalPages = payinhistory[0].totalPages[0]?.count || 0;
    const pages = Math.ceil(totalPages / pageOptions.limit);
    const currentTime = new Date();

    const data = {
        payinhistory: [],
        totalPages: pages
    };

    if (payinhistory.length >= 0){
        payinhistory[0].data.forEach(valuedata => {
            const { _id, owner, status, value, type, username, firstname, lastname, userid, createdAt } = valuedata;
            const canbedeleted = (currentTime - createdAt) >= (1000 * 60 * 60 * 24);

            data.payinhistory.push({
                id: _id,
                owner: owner,
                username: username,
                userid: userid,
                firstname: firstname,
                lastname: lastname,
                value: value,
                status: status,
                type: type,
                createdAt: createdAt,
                canbedeleted: canbedeleted
            });
        });
    }

    return res.json({ message: "success", data: data });
}

exports.gettotalpayin = async(req, res)  => {
    const totalpayin = await Payin.aggregate(
        [
            {
                $match: {
                    status: "done"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$value" }
                }
            }
        ]
    )

    return res.json({message: "success", data: {
        totalpayin: totalpayin.length > 0 ? totalpayin[0].totalAmount : 0,
    }})
}

exports.getpayinhistoryplayerforsuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {page, limit, userid} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const payinhistory = await Payin.find({owner: new mongoose.Types.ObjectId(userid)})
    .populate({
        path: "owner processby",
        select: "username -_id"
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get payin list data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Payin.countDocuments({owner: new mongoose.Types.ObjectId(userid)})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents Payin data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        payinhistory: [],
        totalPages: pages
    }
    
    payinhistory.forEach(valuedata => {
        const {owner, processby, status, value, createdAt} = valuedata

        data.payinhistory.push({
            owner: owner.username,
            processby: processby != null ? processby.username : "",
            status: status,
            value: value,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

//  #endregion