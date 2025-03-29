const router = require("express").Router()
const { getsadashboard, banunbanuser, multiplebanstaffusers, searchadminlist, updateadmin, changepass } = require("../controllers/staffuser")
const { protectplayer, protectsuperadmin, protectadmin } = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .get("/getsadashboard", protectsuperadmin, getsadashboard)
    .get("/adminlist", protectsuperadmin, searchadminlist)
    .post("/banstaffs", protectsuperadmin, multiplebanstaffusers)
    .post("/changepasswordsadmin", protectsuperadmin, updateadmin)
    .post("/changepass", protectsuperadmin, changepass)

    //  #endregion

    //  #region ADMIN

    .get("/getadmindashboard", protectadmin, getsadashboard)
    .post("/changepassadmin", protectadmin, changepass)

    //  #endregion

module.exports = router;
