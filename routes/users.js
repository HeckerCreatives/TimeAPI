const router = require("express").Router()
const { getuserdata, getplayerlist, multiplebanusers, getplayercount, updateuser, searchplayerlist, getuserdetailsbysuperadmin } = require("../controllers/user")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router

    //  #region USER
    .get("/getuserdata", protectplayer, getuserdata)

    //  #endregion

    //  #region SUPERADMIN

    .get("/getuserlist", protectsuperadmin, getplayerlist)
    .get("/getusercount", protectsuperadmin, getplayercount)
    .get("/searchuserlist", protectsuperadmin, searchplayerlist)
    .get("/getuserdetailsbysuperadmin", protectsuperadmin, getuserdetailsbysuperadmin)
    .post("/banusers", protectsuperadmin, multiplebanusers)
    .post("/changepassworduser", protectsuperadmin, updateuser)

    //  #endregion

    //  #region ADMIN

    .get("/getuserlistadmin", protectsuperadmin, getplayerlist)
    .get("/getusercountadmin", protectsuperadmin, getplayercount)
    .get("/searchuserlistadmin", protectsuperadmin, searchplayerlist)
    .post("/banusersadmin", protectsuperadmin, multiplebanusers)
    .post("/changepassworduseradmin", protectsuperadmin, updateuser)

    //  #endregion

module.exports = router;
