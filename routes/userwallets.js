const router = require("express").Router()
const { playerwallets, getplayerwalletforadmin, edituserwalletforadmin } = require("../controllers/wallets")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/userwallets", protectplayer, playerwallets)
    .get("/getplayerwalletforadmin", protectsuperadmin, getplayerwalletforadmin)
    .post("/edituserwalletforadmin", protectsuperadmin, edituserwalletforadmin)

module.exports = router;
