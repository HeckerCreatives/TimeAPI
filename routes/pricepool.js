const { getcurrentpricepool, updatepricepool, usergetpricepool } = require("../controllers/pricepool")
const { protectsuperadmin, protectusers } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getcurrentpricepool", protectsuperadmin, getcurrentpricepool)
.get("/usergetpricepool", protectusers, usergetpricepool)
.post("/updatepricepool", protectsuperadmin, updatepricepool)

module.exports = router