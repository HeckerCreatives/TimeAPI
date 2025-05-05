const { default: mongoose } = require("mongoose")
const Userdetails = require("../models/Userdetails")
const Users = require("../models/Users")
const fs = require("fs")
const Payin = require("../models/Payin")
const bcrypt = require('bcrypt');

//  #region USER

exports.getuserdata = async (req, res) => {
    const {id, username, auth} = req.user

    return res.json({message: "success", data: {
        referralid: id,
        username: username,
        auth: auth
    }})
}

exports.getuserdetails = async (req, res) => {
    const {id, username} = req.user

    const details = await Userdetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user details for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    if (!details){
        return res.status(400).json({ message: "bad-request", data: "There's a problem with your account! Please contact customer support." })
    }

    const data = {
        username: username,
        phonenumber: details.phonenumber,
        fistname: details.firstname,
        lastname: details.lastname,
        address: details.address,
        city: details.city,
        country: details.country,
        postalcode: details.postalcode,
        paymentmethod: details.paymentmethod,
        accountnumber: details.accountnumber
    }

    return res.json({message: "success", data: data})
}

exports.changepassworduser = async (req, res) => {
    const {id, username} = req.user
    const {password} = req.body
    
    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(id)}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem changing password user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem changing your password. Please contact customer support." })
    })

    return res.json({message: "success"})
}

//  #endregion

//  #region SUPERADMIN

exports.getplayerlist = async (req, res) => {
    const {id, username} = req.user
    const {usersearch, status, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    };

    const userlistsearch = {}

    if (usersearch){
        userlistsearch["username"] = { $regex: new RegExp(usersearch, 'i') }
    }

    if (status){
        userlistsearch["status"] = status
    }

    const userlistpipeline = [
        {
            $match: userlistsearch
        },
        {
            $facet: {
                totalCount: [
                    {
                        $count: "total"
                    }
                ],
                data: [
                    {
                        $lookup: {
                            from: "userdetails", // Assuming the collection name for UserDetails is "userdetails"
                            localField: "_id",
                            foreignField: "owner",
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "users", // Assuming the collection name for Users is "users"
                            localField: "referral",
                            foreignField: "_id",
                            as: "referredUser"
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            phonenumber: { $arrayElemAt: ["$userDetails.phonenumber", 0] },
                            referralUsername: { $arrayElemAt: ["$referredUser.username", 0] },
                            createdAt: 1,
                            status: 1
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
    ]


    const userlist = await Users.aggregate(userlistpipeline)
    .catch(err => {

        console.log(`There's a problem getting users list for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting you user details. Please contact customer support." })
    })

    
    console.log(userlist[0].data)

    const data = {
        totalPages: userlist[0].totalCount.length > 0 ? Math.ceil(userlist[0].totalCount[0].total / pageOptions.limit) : 0,
        userlist: []
    }

    userlist[0].data.forEach(value => {
        const {_id, username, status, createdAt, phonenumber, referralUsername} = value

        data["userlist"].push(
            {
                id: _id,
                username: username,
                phonenumber: phonenumber,
                referralUsername: referralUsername,
                status: status,
                createdAt: createdAt
            }
        )
    })

    return res.json({message: "success", data: data})
}

exports.getuserdetailssuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {userid} = req.query

    const details = await Users.findOne({_id: new mongoose.Types.ObjectId(userid)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting user details for ${userid} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    if (!details){
        return res.status(400).json({ message: "failed", data: "No user found! Please select a valid user." })
    }

    const data = {
        username: details.username,
        status: details.status
    }

    return res.json({message: "success", data: data})
}

exports.multiplebanusers = async (req, res) => {
    const {id, username} = req.user;
    const {userlist, status} = req.body

    const data = [];

    userlist.forEach(tempdata => {
        data.push({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(tempdata) },
                update: { status: status }
            }
        })
    })

    if (data.length <= 0){
        return res.json({message: "success"})
    }

    await Users.bulkWrite(data)
    .catch(err => {
        console.log(`There's a problem setting status to ${status} to the users. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: `There's a problem setting status to ${status} to the users`})
    })

    return res.json({message: "success"})
}

exports.getplayercount = async (req, res) => {
    const {id, username} = req.user

    const totalusers = await Users.countDocuments()
    .then(data => data)

    const activeusers = await Payin.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $match: { 
                status: "done",
                "user.status": { $ne: "banned" } // Exclude banned users
            }
        },
        {
            $group: {
                _id: "$owner",
            }
        },
        {
            $count: "totalUsers"
        }
    ]);

    const banusers = await Users.countDocuments({status: "banned"})
    .then(data => data)

    data = {
        totalusers: totalusers,
        activeusers: activeusers[0] ? activeusers[0].totalUsers : 0,
        banusers: banusers
    }

    return res.json({message: "success", data: data})
}

exports.updateuser = async (req, res) => {
    const {id, username} = req.user
    const {userid, password} = req.body

    if (password == ""){
        return res.status(400).json({ message: "failed", data: "Please complete the form first before saving!" })
    }

    const hashPassword = bcrypt.hashSync(password, 10)

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(userid)}, {password: hashPassword})
    .catch(err => {

        console.log(`There's a problem updating user data for ${userid}, admin execution: ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    return res.json({message: "success"})
}

exports.searchplayerlist = async (req, res) => {
    const {id, username} = req.user
    const {playerusername} = req.query

    const userlistpipeline = [
        {
            $match: {
                username: { $regex: new RegExp(playerusername, 'i') }
            }
        },
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "userdetails", // Assuming the collection name for UserDetails is "userdetails"
                            localField: "_id",
                            foreignField: "owner",
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "users", // Assuming the collection name for Users is "users"
                            localField: "referral",
                            foreignField: "_id",
                            as: "referredUser"
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            email: { $arrayElemAt: ["$userDetails.email", 0] },
                            referralUsername: { $arrayElemAt: ["$referredUser.username", 0] },
                            createdAt: 1,
                            status: 1
                        }
                    }
                ]
            }
        }
    ]

    const userlist = await Users.aggregate(userlistpipeline)
    .catch(err => {
        console.log(`There's a problem getting users list for ${username}. Error: ${err}`)
        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        totalPages: 0,
        userlist: []
    }

    userlist[0].data.forEach(value => {
        const {_id, username, status, createdAt, email, referralUsername} = value

        data["userlist"].push(
            {
                id: _id,
                username: username,
                email: email,
                referralUsername: referralUsername,
                status: status,
                createdAt: createdAt
            }
        )
    })

    return res.json({message: "success", data: data})

}

exports.getuserdetailsbysuperadmin = async (req, res) => {
    const {id, user} = req.user

    const {userid} = req.query

    const userdetails = await Users.findOne({_id: new mongoose.Types.ObjectId(userid)})
    .populate({
        path: "referral",
        select: "username"
    })
    .then(data => data)
    .catch(err => err)

    console.log(userdetails)
    const data = {
        username: userdetails.username,
        referral: userdetails.referral?.username || "N/A",
        banstatus: userdetails.status,
        referralid: userdetails.referral?._id || ""
    }

    return res.json({message: "success", data: data})
}

//  #endregion