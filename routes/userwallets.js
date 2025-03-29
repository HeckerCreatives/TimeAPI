const router = require("express").Router()
const { playerwallets, getplayerwalletforadmin } = require("../controllers/wallets")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/userwallets", protectplayer, playerwallets)
    .get("/getplayerwalletforadmin", protectsuperadmin, getplayerwalletforadmin)

module.exports = router;
