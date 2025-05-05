const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")
const Inventoryhistory = require("../models/Inventoryhistory")
const { saveinventoryhistory, getfarm } = require("../utils/inventorytools")
const { walletbalance, reducewallet, sendcommissionunilevel, addwallet } = require("../utils/walletstools")
const { DateTimeServerExpiration, DateTimeServer, AddUnixtimeDay, RemainingTime } = require("../utils/datetimetools")
const { addanalytics } = require("../utils/analyticstools")
const { addwallethistory } = require("../utils/wallethistorytools")
const Maintenance = require("../models/Maintenance")
const Chrono = require("../models/Chrono")

//  #region USER

exports.buychrono = async (req, res) => {
    const {id, username} = req.user
    const {type, pricechrono, skip } = req.body
    let adjustedProfit = 1


    const totalchrono = await Inventory.find({owner: new mongoose.Types.ObjectId(id), type: type})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory chrono of ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support."})
    })


    const wallet = await walletbalance("creditwallet", id)

    if (wallet == "failed"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet == "nodata"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }

    if (wallet < pricechrono){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this Chrono! Please top up first and try again.` })
    }

    const chrono = await Chrono.findOne({ type: type })
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the chrono data of ${type}. Error: ${err}`)
        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support."})
    })

    const purchased = await Inventory.find({
        owner: new mongoose.Types.ObjectId(id),
        type: { $in: ["rolex_ai_bot", "patek_philippe_ai_bot", "audemars_piguet_ai_bot"] },
        promo: { $ne: "Free" }

    })

    const totalpurchased = purchased.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + entry.price;
        return acc;
    }, {});


    if (type == "rolex_ai_bot"){
        const totalleft = chrono.max - totalpurchased["rolex_ai_bot"]
        if (pricechrono > totalleft){
            return res.status(400).json({ message: 'failed', data: `You can only buy ${totalleft} more of ${chrono.type}`})
        }
    } else if (type == "patek_philippe_ai_bot"){
        const totalleft = chrono.max - totalpurchased["patek_philippe_ai_bot"]
        if (pricechrono > totalleft){
            return res.status(400).json({ message: 'failed', data: `You can only buy ${totalleft} more of ${chrono.type}`})
        }
    } else if (type == "audemars_piguet_ai_bot"){
        const totalleft = chrono.max - totalpurchased["audemars_piguet_ai_bot"]
        if (pricechrono > totalleft){
            return res.status(400).json({ message: 'failed', data: `You can only buy ${totalleft} more of ${chrono.type}`})
        }
    }


    
    if (pricechrono < chrono.min){
        return res.status(400).json({ message: 'failed', data: `The minimum price for ${chrono.type} is ${chrono.min} pesos`})
    }
    
    if (pricechrono > chrono.max){
        return res.status(400).json({ message: 'failed', data: `The maximum price for ${chrono.type} is ${chrono.max} pesos`})
    }

    let finalprice = 0

    if (skip === true) {
        finalprice = chrono.profit * 0.5;
    } else {
        finalprice = chrono.profit * adjustedProfit;
    }

    const buy = await reducewallet("creditwallet", pricechrono, id)

    if (buy != "success"){
        return res.status(400).json({ message: 'failed', data: `You don't have enough funds to buy this chrono! Please top up first and try again.` })
    }

    const unilevelrewards = await sendcommissionunilevel(pricechrono, id, chrono.type)

    if (unilevelrewards != "success"){
        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    }
    
    const totalprofit = (pricechrono * finalprice)

    if(chrono.isBuyonetakeone == '1'){

        const totalprofitb1t1 = (totalprofit * 2) + pricechrono
        const timesprofit = chrono.profit * 2

        //  PAYMENT + PROFIT
        await Inventory.create({owner: new mongoose.Types.ObjectId(id), isb1t1: true, type: chrono.type, expiration: DateTimeServerExpiration(chrono.duration), profit: chrono.profit, price: pricechrono, startdate: DateTimeServer(), name: chrono.name, duration: chrono.duration, promo: 'Double Time'})
        .catch(err => {
    
            console.log(`Failed to chrono inventory data for ${username} type: ${type} b1t1: true, error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
        const inventoryhistory = await saveinventoryhistory(id, chrono.type, pricechrono, `Buy ${chrono.name} buy one take one`)

        await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${chrono.name} buy one take one`, `User ${username} bought ${chrono.type}`, pricechrono)

        //  PROFIT
        await Inventory.create({owner: new mongoose.Types.ObjectId(id), isb1t1: true, type: chrono.type, expiration: DateTimeServerExpiration(chrono.duration), profit: chrono.profit, price: pricechrono, startdate: DateTimeServer(), name: chrono.name, duration: chrono.duration, promo: 'Free'})
        .catch(err => {
    
            console.log(`Failed to chrono inventory data for ${username} type: ${type} b1t1: true, error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
        const inventoryhistoryfree = await saveinventoryhistory(id, chrono.type, 0, `Buy ${chrono.name} buy one take one`)

        await addanalytics(id, inventoryhistoryfree.data.transactionid, `Buy ${chrono.name} buy one take one`, `User ${username} bought ${chrono.type}`, 0)

    } else {

        await Inventory.create({owner: new mongoose.Types.ObjectId(id), isb1t1: false, type: chrono.type, expiration: DateTimeServerExpiration(chrono.duration), profit: finalprice, price: pricechrono, startdate: DateTimeServer(), name: chrono.name, duration: chrono.duration, promo: 'Regular'})
        .catch(err => {
    
            console.log(`Failed to chrono inventory data for ${username} type: ${type}, error: ${err}`)
    
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })
    
        
        const inventoryhistory = await saveinventoryhistory(id, chrono.type, pricechrono, `Buy ${chrono.name}`)
        
        await addanalytics(id, inventoryhistory.data.transactionid, `Buy ${chrono.name}`, `User ${username} bought ${chrono.type}`, pricechrono)
    }

    return res.json({message: "success"})
}

exports.getinventory = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const chrono = await Inventory.find({owner: id})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Inventory.countDocuments({owner: id})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        chronos: {},
        totalPages: pages
    }

    let index = 0

    chrono.forEach(datachrono => {
        const {_id, type, price, profit, duration, isb1t1, startdate, createdAt, name, promo} = datachrono

        console.log(startdate, duration)
        console.log(AddUnixtimeDay(startdate, duration))

        const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), (price * profit) + price)
        const remainingtime = RemainingTime(parseFloat(startdate), duration)

        const createdAtDate = new Date(createdAt);

        const matureDate = new Date(createdAtDate);
        matureDate.setDate(createdAtDate.getDate() + duration); 



        data.chronos[index] = {
            chronoid: _id,
            name: name,
            type: type,
            buyprice: price,
            profit: profit,
            isb1t1: isb1t1,
            duration: duration,
            earnings: earnings,
            promo: promo,
            remainingtime: remainingtime,
            purchasedate: createdAt,
            maturedate: matureDate.toISOString()
        }

        index++
    })

    return res.json({message: "success", data: data})
}

exports.claimchrono = async (req, res) => {
    const {id, username} = req.user

    const {chronoid} = req.body

    if (!chronoid){
        return res.status(400).json({message: "failed", data: "There's no existing chrono! Please contact customer support for more details"})
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Step 1: Find and Delete Chrono
        const chronoinventorydata = await Inventory.findOneAndDelete(
            { _id: new mongoose.Types.ObjectId(chronoid), owner: new mongoose.Types.ObjectId(id) },
            { returnDocument: "before", session }
        );

        if (!chronoinventorydata) {
            await session.abortTransaction();
            return res.status(400).json({ message: "failed", data: "There's no existing chrono! Please contact customer support for more details" });
        }

        // Step 2: Get Chrono Data
        const chrono = await Chrono.findOne({ type: chronoinventorydata.type }).session(session);

        if (!chrono) {
            await session.abortTransaction();
            return res.status(400).json({ message: "failed", data: "There's no existing chrono! Please contact customer support for more details" });
        }

        const remainingtime = RemainingTime(parseFloat(chronoinventorydata.startdate), chronoinventorydata.duration);

        if (remainingtime > 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "failed", data: "There are still remaining time before claiming! Wait for the timer to complete." });
        }

        // Step 3: Calculate Earnings

        let earnings = 0;

        if (chronoinventorydata.promo == "Regular" || chronoinventorydata.promo == "Double Time"){
            earnings = (chronoinventorydata.price * chronoinventorydata.profit) + chronoinventorydata.price;
        }
        else{
            earnings = chronoinventorydata.price * chronoinventorydata.profit;
        }

        // Step 4: Update Wallets (Ensure These Functions Support Transactions)
        await addwallet("chronocoinwallet", earnings, id, session);
        await addwallethistory(id, "chronocoinwallet", earnings, process.env.ADMIN_ID, chronoinventorydata.name, session);
        const inventoryhistory = await saveinventoryhistory(id, chronoinventorydata.type, earnings, `Claim ${chronoinventorydata.name}`, session);
        await addanalytics(id, inventoryhistory.data.transactionid, `Claim ${chronoinventorydata.name}`, `User ${username} claim earnings ${earnings}`, earnings, session);

        // Commit Transaction
        await session.commitTransaction();
        session.endSession();

        return res.json({ message: "success" });

    } catch (error) {
        console.log(`Error claiming chrono: ${error}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "error", data: "Something went wrong! Please try again later." });
    }

}

exports.getbuyhistory = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({
        owner: new mongoose.Types.ObjectId(id),
        type: { $regex: /^Buy/, $options: 'i' } 
    })
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Buy/, $options: "i" }})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {chronotype, amount, createdAt, name} = tempdata

        data.history.push({
            chronotype: chronotype,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.getclaimhistory = async (req, res) => {
    const {id, username} = req.user
    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const history = await Inventoryhistory.find({owner: new mongoose.Types.ObjectId(id), type: { $regex: /^Claim/, $options: "i" }})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory history of ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem getting the inventory history. Please contact customer support."})
    })

    if (history.length <= 0){
        return res.json({message: "success", data: {
            history: [],
            totalpages: 0
        }})
    }

    const totalPages = await Inventoryhistory.countDocuments({owner: new mongoose.Types.ObjectId(id),type: { $regex: /^Claim/, $options: "i" }})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory history data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        history: [],
        totalpages: pages
    }

    history.forEach(tempdata => {
        const {chronotype, amount, createdAt} = tempdata

        data.history.push({
            chronotype: chronotype,
            amount: amount,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.gettotalpurchased = async (req, res) => {
    const {id, username} = req.user

    const finaldata = {
        totalpurchased: 0
    }

    const statisticInventoryHistory = await Inventoryhistory.aggregate([
        { 
            $match: { 
                owner: new mongoose.Types.ObjectId(id), 
                type: { $regex: /^Buy/, $options: "i" }
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
        console.log(`There's a problem getting the statistics of total purchase for ${username}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data : "There's a problem getting the statistics of total purchased. Please contact customer support."})
    })

    if (statisticInventoryHistory.length > 0) {
        finaldata.totalpurchased = statisticInventoryHistory[0].totalAmount;
    }

    return res.json({message: "success", data: finaldata})
}

exports.getremainingunclaimedchrono = async (req, res) => {
    const {id, username} = req.user
    const chrono = await Inventory.find({owner: id})
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${username}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const data = {
        unclaimed: 0
    }

    chrono.forEach(datachrono => {
        const {price, profit, duration, startdate} = datachrono

        const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), (price * profit) + price)

        data.unclaimed += earnings
    })

    return res.json({message: "success", data: data})
}

exports.getchronobuystatus = async (req, res) => {
    const {id} = req.user

    const total = await Inventory.find({owner: new mongoose.Types.ObjectId(id)})
    
    let canbuy = true;

    if (total > 0){
        canbuy = false
    }

    return res.json({message: "success", data: canbuy})
}

//  #endregion

//  #region SUPERADMIN

exports.getplayerinventoryforsuperadmin = async (req, res) => {
    const {id, username} = req.user
    const {playerid, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const chrono = await Inventory.find({owner: playerid})
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .sort({'createdAt': -1})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to get inventory data for ${playerid}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const totalPages = await Inventory.countDocuments({owner: playerid})
    .then(data => data)
    .catch(err => {

        console.log(`Failed to count documents inventory data for ${playerid}, error: ${err}`)

        return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
    })

    const pages = Math.ceil(totalPages / pageOptions.limit)

    const data = {
        inventory: []
    }

    let index = 0

    chrono.forEach(datachrono => {
        const {_id, type, price, profit, duration, startdate, createdAt} = datachrono

        const earnings = getfarm(startdate, AddUnixtimeDay(startdate, duration), (price * profit) + price)
        // const remainingtime = RemainingTime(parseFloat(startdate), AddUnixtimeDay(startdate, duration))
        const remainingtime = RemainingTime(parseFloat(startdate), duration)

        data.inventory[index] = {
            chronoid: _id,
            type: type,
            buyprice: price,
            profit: profit,
            duration: duration,
            earnings: earnings,
            remainingtime: remainingtime,
            purchasedate: createdAt
        }

        index++
    })

    data["totalPages"] = pages

    return res.json({message: "success", data: data})
}

//  #endregion


exports.maxplayerinventorysuperadmin = async (req, res) => {
    
    const {id, username} = req.user

    const { chronoid} = req.body
    
    try {    
    
        const chrono = await Inventory.findOne({ _id: new mongoose.Types.ObjectId(chronoid) })
        .then(data => data)
        chrono.duration = 0.0007

        await chrono.save();

        return res.status(200).json({ message: "success"});
        
    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}

exports.deleteplayerinventorysuperadmin = async (req, res) => {
    const {id, username} = req.user

    const {chronoid} = req.body
    
    try {    
        const chrono = await Inventory.findOne({  _id: new mongoose.Types.ObjectId(chronoid) });

        console.log(chrono)
        if (!chrono) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }

        const inventoryhistory = await Inventoryhistory.findOne({ 
            owner: new mongoose.Types.ObjectId(chrono.owner),
            createdAt: {
            $gte: new Date(chrono.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(chrono.createdAt.getTime() + 10000)  // 3 seconds after
            },
            chronotype: chrono.type 
        }).catch(err => {
            console.log(`Failed to delete inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        if (!inventoryhistory) {
            return res.status(400).json({ message: 'failed', data: `There's a problem with the server! Please contact customer support.` });
        }        

        await Inventory.findOneAndDelete({ _id: new mongoose.Types.ObjectId(chronoid) })
        .then(data => data)
        .catch(err => {
            console.log(`There's a problem getting the chrono data for ${username}. Error: ${err}`)
            
            return res.status(400).json({message: "bad-request", data: "There's a problem getting the chrono data! Please contact customer support"})
        })

        await Inventoryhistory.findOneAndDelete({ 
            owner: new mongoose.Types.ObjectId(chrono.owner),
            createdAt: {
            $gte: new Date(chrono.createdAt.getTime() - 10000), // 3 seconds before
            $lte: new Date(chrono.createdAt.getTime() + 10000)  // 3 seconds after
            },
            chronotype: chrono.type 
        }).catch(err => {
            console.log(`Failed to delete inventory history for ${username}, error: ${err}`)
            return res.status(400).json({ message: 'failed', data: `There's a problem with your account. Please contact customer support for more details` })
        })

        return res.status(200).json({ message: "success"});

    } catch (error) {
        console.error(error)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server! Please contact customer support."});
    }
}
