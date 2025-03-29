const { getchrono, editchrono, getUserChrono } = require("../controllers/chrono")
const { protectsuperadmin, protectusers } = require("../middleware/middleware")

const router = require("express").Router()

router
.get("/getchrono", protectusers, getchrono)
.get("/getUserChrono", protectusers, getUserChrono)
.post("/editchrono", protectsuperadmin, editchrono)

module.exports = router