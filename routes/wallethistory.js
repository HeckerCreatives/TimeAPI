const router = require("express").Router()
const { playerwallethistory, getwallettotalearnings, getwallettotalearningsforadmin, deleteplayerwallethistoryforadmin, getplayerwallethistoryforadmin, editplayerwallethistoryforadmin, createplayerwallethistoryforadmin, getwalletstatistics, getwalletstatisticssuperadmin } = require("../controllers/wallethistory")
const { protectplayer, protectsuperadmin, protectadmin } = require("../middleware/middleware")

router
    .get("/getwalletstatistics", protectplayer, getwalletstatistics)
    .get("/getwalletstatisticssuperadmin", protectsuperadmin, getwalletstatisticssuperadmin)

    .get("/userwallethistory", protectplayer, playerwallethistory)
    .get("/getwallettotalearnings", protectplayer, getwallettotalearnings)
    .get("/getwallettotalearningsforadmin", protectsuperadmin, getwallettotalearningsforadmin)
    .get("/getplayerwallethistoryforadmin", protectsuperadmin, getplayerwallethistoryforadmin)
    
    .post("/editplayerwallethistoryforadmin", protectsuperadmin, editplayerwallethistoryforadmin)
    .post("/createplayerwallethistoryforadmin", protectsuperadmin, createplayerwallethistoryforadmin)
    .post("/deleteplayerwallethistoryforadmin", protectsuperadmin, deleteplayerwallethistoryforadmin)
    
module.exports = router;
