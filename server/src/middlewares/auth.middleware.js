const jwt = require("jsonwebtoken");
const User = require("../features/Users/user.model");

async function protect(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        status: "Unauthorized",
        timestamp: new Date().toISOString(),
        message: "No token provided",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    let user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        status: "Not Found",
        timestamp: new Date().toISOString(),
        message: "User not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "Internal Server Error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
}

function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        status: "Forbidden",
        timestamp: new Date().toISOString(),
        message: "You do not have permission to access this resource",
      });
    }
    next();
  };
}

module.exports = { protect, authorize };
