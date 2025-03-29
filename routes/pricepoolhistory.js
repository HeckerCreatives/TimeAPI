const { distributepricepool, getdistributionhistory } = require("../controllers/pricepoolhistory")
const { protectsuperadmin, protectusers } = require("../middleware/middleware")

const router = require("express").Router()

router
.post("/distributepricepool", protectsuperadmin, distributepricepool)
.get("/getdistributionhistory", protectsuperadmin, getdistributionhistory)

module.exports = router