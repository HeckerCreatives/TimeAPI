const router = require("express").Router()
const { playerwallethistory, getwallettotalearnings, getwallettotalearningsforadmin } = require("../controllers/wallethistory")
const { protectplayer, protectsuperadmin, protectadmin } = require("../middleware/middleware")

router
    .get("/userwallethistory", protectplayer, playerwallethistory)
    .get("/getwallettotalearnings", protectplayer, getwallettotalearnings)
    .get("/getwallettotalearningsforadmin", protectsuperadmin, getwallettotalearningsforadmin)

module.exports = router;
