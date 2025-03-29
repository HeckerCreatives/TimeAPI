const routers = app => {
    console.log("Routers are all available");

    app.use("/analytics", require("./analytics"))
    app.use("/auth", require("./auth"))
    app.use("/chrono", require("./chrono"))
    app.use("/globalpass", require("./globalpass"))
    app.use("/inventory", require("./inventory"))
    app.use("/maintenance", require("./maintenance"))
    app.use("/payin", require("./payin"))
    app.use("/payout", require("./payout"))
    app.use("/pricepool", require("./pricepool"))
    app.use("/pricepoolhistory", require("./pricepoolhistory"))
    app.use("/staffusers", require("./staffusers"))
    app.use("/unilevel", require("./unilevel"))
    app.use("/user", require("./users"))
    app.use("/wallets", require("./userwallets"))
    app.use("/wallethistory", require("./wallethistory"))
}

module.exports = routers