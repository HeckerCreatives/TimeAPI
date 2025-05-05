const router = require("express").Router()
const { playerwallethistory, getwallettotalearnings, getwallettotalearningsforadmin, deleteplayerwallethistoryforadmin, getplayerwallethistoryforadmin } = require("../controllers/wallethistory")
const { protectplayer, protectsuperadmin, protectadmin } = require("../middleware/middleware")

router
    .get("/userwallethistory", protectplayer, playerwallethistory)
    .get("/getwallettotalearnings", protectplayer, getwallettotalearnings)
    .get("/getwallettotalearningsforadmin", protectsuperadmin, getwallettotalearningsforadmin)
    .post("/deleteplayerwallethistoryforadmin", protectsuperadmin, deleteplayerwallethistoryforadmin)
    .get("/getplayerwallethistoryforadmin", protectsuperadmin, getplayerwallethistoryforadmin)


module.exports = router;
