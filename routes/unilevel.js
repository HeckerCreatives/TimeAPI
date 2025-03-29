const router = require("express").Router()
const { playerunilevel, playeviewadminunilevel, playerviewadminunilevelCommissionWallet, playerviewadminunilevelDirectCommissionWallet } = require("../controllers/unilevel")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router
    .get("/userunilevel", protectplayer, playerunilevel)
    .get("/playeviewadminunilevel", protectsuperadmin, playeviewadminunilevel)
    .get("/playerviewadminunilevelCommissionWallet", protectsuperadmin, playerviewadminunilevelCommissionWallet)
    .get("/playerviewadminunilevelDirectCommissionWallet", protectsuperadmin, playerviewadminunilevelDirectCommissionWallet)

module.exports = router;
