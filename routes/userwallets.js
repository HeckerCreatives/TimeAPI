const router = require("express").Router()
const { playerwallets, getplayerwalletforadmin, editplayerwalletforadmin } = require("../controllers/wallets")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/userwallets", protectplayer, playerwallets)
    .get("/getplayerwalletforadmin", protectsuperadmin, getplayerwalletforadmin)
    .post("/editplayerwalletforadmin", protectsuperadmin, editplayerwalletforadmin)

module.exports = router;
