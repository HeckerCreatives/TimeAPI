const { default: mongoose } = require("mongoose")
const Userwallets = require("../models/Userwallets")
const Users = require("../models/Users")
const Wallethistory = require("../models/Wallethistory")
const Analytics = require("../models/Analytics")


exports.walletbalance = async (type, id) => {
    const balance = await Userwallets.findOne({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get wallet data for ${data.owner} type: ${type}, error: ${err}`)

        return "failed"
    })

    if (!balance){
        console.log(`No wallet data for ${data.owner} type: ${type}, error: ${err}`)
        return "nodata"
    }

    return balance.amount
}

exports.reducewallet = async (type, price, id) => {

    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), type: type}, {$inc: { amount: -price}})
    .catch(err => {

        console.log(`Failed to reduce wallet data for ${id} type: ${type} price: ${price}, error: ${err}`)

        return "failed"
    })

    return "success"
}

exports.sendcommissionunilevel = async (commissionAmount, id, minertype) => {

    const pipeline = [
        // Match the sender
        {
            $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        // GraphLookup to recursively traverse the referral chain
        {
            $graphLookup: {
                from: 'users',
                startWith: '$referral',
                connectFromField: 'referral',
                connectToField: '_id',
                as: 'referralChain',
                maxDepth: 9, // Set the maximum depth to your needs
                depthField: 'level',
            },
        },
        // Project to check the referral chain after the $graphLookup stage
        {
            $project: {
                _id: 1,
                referralChain: '$referralChain',
            },
        },
        // Unwind the referral chain array
        {
            $unwind: '$referralChain',
        },
        // Project to check the fields after the $unwind stage
        {
            $project: {
                _id: '$referralChain._id',
                level: '$referralChain.level',
                originalCommissionPercentage: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$referralChain.level', 0] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.15]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.15]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 1] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 2] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 3] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 4] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 5] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 6] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 7] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 8] }, then: { $cond: {
                                        if: { $eq: ['$referralChain._id', new mongoose.Types.ObjectId(process.env.ADMIN_ID)]},
                                        then: {
                                            $multiply: [commissionAmount, 0.01]
                                        },
                                        else : {
                                            $multiply: [commissionAmount, 0.01]
                                        }
                                    } 
                                }
                            },
                            { case: { $eq: ['$referralChain.level', 9] }, then: { $multiply: [commissionAmount, 0.01] } },
                        ],
                        default: 0,
                    },
                },
            },
        },
        // Group to calculate the total commissionPercentage for each level
        {
            $group: {
                _id: '$_id',
                level: {$first: '$level'},
                amount: { $sum: '$originalCommissionPercentage' },
            },
        },
    ];

    const unilevelresult = await Users.aggregate(pipeline)
    .catch(err => {

        console.log(`Failed to get unilevel data for ${id} amount: ${commissionAmount} , error: ${err}`)

        return "failed"
    })

    console.log('Test 1: ')
    console.log(unilevelresult)
    console.log('End Test 1: ')

    const historypipeline = []
    const analyticspipeline = []

    unilevelresult.forEach(dataresult => {
        const { _id, level, amount } = dataresult

        if (level == 0){

            historypipeline.push({owner: new mongoose.Types.ObjectId(_id), type: "directcommissionwallet", amount: amount, minertype: minertype, from: new mongoose.Types.ObjectId(id)})

            analyticspipeline.push({owner: new mongoose.Types.ObjectId(_id), type: "directcommissionwallet", description: `Unilevel from ${id} to ${_id} with commission total amount of ${commissionAmount} and direct commission amount of ${amount}`, amount: amount})
        }
        else{
            historypipeline.push({owner: new mongoose.Types.ObjectId(_id), type: "commissionwallet", amount: amount, minertype: minertype, from: new mongoose.Types.ObjectId(id)})
    
            analyticspipeline.push({owner: new mongoose.Types.ObjectId(_id), type: "commissionwallet", description: `Unilevel from ${id} to ${_id} with commission total amount of ${commissionAmount} and commission amount of ${amount}`, amount: amount})
        }
    })

    console.log('Test 2: ')
    console.log(analyticspipeline)
    console.log('End Test 2: ')


    const bulkOperationUnilvl = unilevelresult.map(({_id, amount }) => ({
        updateOne: {
            filter: { owner: new mongoose.Types.ObjectId(_id), type: 'commissionwallet' },
            update: { $inc: { amount: amount}}
        }
    }))

    await Userwallets.bulkWrite(bulkOperationUnilvl)
    .catch(err => {

        console.log(`Failed to distribute commission wallet data, unilevel parent: ${id} commission amount: ${commissionAmount}, error: ${err}`)

        return "failed"
    })

    await Wallethistory.insertMany(historypipeline)
    .catch(async err => {

        console.log(`Failed to write commission wallet history data, unilevel parent: ${id} commission amount: ${commissionAmount}, error: ${err}`)

        return "failed"
    })

    await Analytics.insertMany(analyticspipeline)
    .catch(async err => {

        console.log(`Failed to write commission wallet analytics data, unilevel parent: ${id} commission amount: ${commissionAmount}, error: ${err}`)

        return "failed"
    })


    return "success"
}

exports.addwallet = async (type, price, id) => {
    await Userwallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), type: type}, {$inc: { amount: price}})
    .catch(err => {

        console.log(`Failed to add wallet data for ${id} type: ${type} price: ${price}, error: ${err}`)

        return "failed"
    })

    return "success"
}