const router = require("express").Router()
const { authlogin, register, registerstaffs, getreferralusername, automaticlogin, logout } = require("../controllers/auth")
const { protectsuperadmin, protectusers, captureIpAddress } = require("../middleware/middleware")

router
    .get("/login", captureIpAddress, authlogin)
    .get("/getreferralusername", getreferralusername)
    .get("/automaticlogin", protectusers, automaticlogin)
    .post("/register", register)
    .post("/registerstaffs", protectsuperadmin, registerstaffs)
    .get("/logout", logout)
module.exports = router;
