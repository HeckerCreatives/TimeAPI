const router = require("express").Router()
const { getpayingraph, getcommissiongraph, getproductgraph, getearningpayoutgraph, getunilevelpayoutgraph, gettotalpayinperday, getreferrallinkstatus, getcommissionlist } = require("../controllers/analytics")
const { protectplayer, protectsuperadmin } = require("../middleware/middleware")

router

    //  #region USER

    .get("/getreferrallinkstatus", protectplayer, getreferrallinkstatus)

    //  #endregion

    //  #region SUPERADMIN

    .get("/getpayingraph", protectsuperadmin, getpayingraph)
    .get("/getcommissiongraph", protectsuperadmin, getcommissiongraph)
    .get("/getminerbuygraph", protectsuperadmin, getproductgraph)
    .get("/getminerpayoutgraph", protectsuperadmin, getearningpayoutgraph)
    .get("/getunilevelpayoutgraph", protectsuperadmin, getunilevelpayoutgraph)
    .get("/getsales", protectsuperadmin, gettotalpayinperday)

    //  #endregion

    //  #region ADMIN

    .get("/getpayingraphadmin", protectsuperadmin, getpayingraph)
    .get("/getcommissiongraphadmin", protectsuperadmin, getcommissiongraph)
    .get("/getminerbuygraphadmin", protectsuperadmin, getproductgraph)
    .get("/getminerpayoutgraphadmin", protectsuperadmin, getearningpayoutgraph)
    .get("/getunilevelpayoutgraphadmin", protectsuperadmin, getunilevelpayoutgraph)
    .get("/getsalesadmin", protectsuperadmin, gettotalpayinperday)
    .get("/getcommissionlist", protectsuperadmin, getcommissionlist)

    //  #endregion

module.exports = router;
