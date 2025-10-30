const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { getLoggedInUser } = require("./user.controller");
const router = express.Router();

router.get("/profile", protect, getLoggedInUser);

module.exports = router;
