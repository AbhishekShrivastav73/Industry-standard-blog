// @ Route - GET /api/user/profile
// @ Desc - Get logged in user
// @ Access - Private/Protected
module.exports.getLoggedInUser = (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    data: req.user,
  });
};
