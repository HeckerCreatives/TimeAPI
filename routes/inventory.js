const router = require("express").Router()
const { getinventory, getclaimhistory, getbuyhistory, getplayerinventoryforsuperadmin, buychrono, claimchrono, getremainingunclaimedchrono, maxplayerinventorysuperadmin, deleteplayerinventorysuperadmin } = require("../controllers/inventory")
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
    .post("/deleteplayerinventoryforadmin", protectsuperadmin, deleteplayerinventorysuperadmin)
    .post("/deleteplayerinventoryhistorysuperadmin", protectsuperadmin, deleteplayerinventorysuperadmin)
    
module.exports = router;
