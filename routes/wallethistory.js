const router = require("express").Router()
const { playerwallethistory, getwallettotalearnings } = require("../controllers/wallethistory")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/userwallethistory", protectplayer, playerwallethistory)
    .get("/getwallettotalearnings", protectplayer, getwallettotalearnings)

module.exports = router;
