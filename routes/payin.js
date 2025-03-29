const router = require("express").Router()
const { sendfiattoplayer, deletepayinplayersuperadmin, getpayinhistorysuperadmin, getpayinhistoryplayer, getpayinhistoryplayerforsuperadmin } = require("../controllers/payin")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router

    //  #region USER

    .get("/getpayinhistoryuser", protectsuperadmin, getpayinhistoryplayer)

    //  #endregion

    //  #region SUPERADMIN

    .get("/getpayinhistorysuperadmin", protectsuperadmin, getpayinhistorysuperadmin)
    .get("/getpayinhistoryplayerforsuperadmin", protectsuperadmin, getpayinhistoryplayerforsuperadmin)
    .post("/deletepayinplayersuperadmin", protectsuperadmin, deletepayinplayersuperadmin)
    .post("/sendfiattoplayer", protectsuperadmin, sendfiattoplayer)

    //  #endregion

module.exports = router;
