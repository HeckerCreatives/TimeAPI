const router = require("express").Router()
const { getinventory, getclaimhistory, getbuyhistory, getplayerinventoryforsuperadmin, buychrono, claimchrono, getremainingunclaimedchrono, maxplayerinventorysuperadmin } = require("../controllers/inventory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    // .get("/getremainingunclaimedchrono", protectplayer, getremainingunclaimedchrono)
    .get("/getbuyhistory", protectplayer, getbuyhistory)
    .get("/getclaimhistory", protectplayer, getclaimhistory)
    .get("/getinventory", protectplayer, getinventory)
    .get("/getplayerinventoryforsuperadmin", protectsuperadmin, getplayerinventoryforsuperadmin)
    .post("/buychrono", protectplayer, buychrono)
    .post("/claimchrono", protectplayer, claimchrono)
    .post("/maxplayerinventorysuperadmin", protectsuperadmin, maxplayerinventorysuperadmin)
module.exports = router;
