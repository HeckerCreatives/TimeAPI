const { getmaintenance, changemaintenance, geteventmainte } = require("../controllers/maintenance")
const { protectsuperadmin, protectusers } = require("../middleware/middleware")

const router = require("express").Router()

router 
.get("/getmaintenance", protectusers, getmaintenance)
.get("/geteventmaintenance", protectusers, geteventmainte)
.post("/changemaintenance", protectsuperadmin, changemaintenance)


module.exports = router