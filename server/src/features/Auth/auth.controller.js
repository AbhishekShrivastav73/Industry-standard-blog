const { client } = require("../../config/redis");
const User = require("../Users/user.model");
const { registerSchema, loginSchema } = require("./validators/auth.validator");
const jwt = require("jsonwebtoken");

// @ Route : POST /api/auth/register
// @ Desc : Register a new user
// @ Access : Public
module.exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "Bad Request",
        success: false,
        timestamp: new Date().toISOString(),
        message: error.details[0].message,
      });
    }

    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: true,
        status: "Bad Request",
        timestamp: new Date().toISOString(),
        message: "User already exists",
      });
    }

    user = new User({ name, email, password, role });
    await user.save();

    const { accessToken, refreshToken } = user.geneateJWT();

    user.refreshToken = refreshToken;
    await user.save();

    await client.setEx(
      `user:${user._id}:refreshToken`,
      7 * 24 * 60 * 60,
      refreshToken
    ); // Store refresh token in Redis for 7 days

    res.status(201).json({
      success: true,
      status: "Created",
      timestamp: new Date().toISOString(),
      message: "User registered successfully",
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "Internal Server Error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
};

// @ Route : POST /api/auth/login
// @ Desc : Login a user
// @ Access : Public

module.exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "Bad Request",
        success: false,
        timestamp: new Date().toISOString(),
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        status: "Bad Request",
        timestamp: new Date().toISOString(),
        message: "Invalid email or password",
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        status: "Bad Request",
        timestamp: new Date().toISOString(),
        message: "Invalid email or password",
      });
    }
    const { accessToken, refreshToken } = user.geneateJWT();
    user.refreshToken = refreshToken;
    await user.save();
    await client.setEx(
      `user:${user._id}:refreshToken`,
      7 * 24 * 60 * 60,
      refreshToken
    ); // Store refresh token in Redis for 7 days
    return res.status(200).json({
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "User logged in successfully",
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "Internal Server Error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
};

// @ Route : POST /api/auth/refresh-token
// @ Desc : Refresh access and refresh tokens
// @ Access : Public
module.exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        status: "Bad Request",
        timestamp: new Date().toISOString(),
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        status: "Unauthorized",
        timestamp: new Date().toISOString(),
        message: "Invalid refresh token",
      });
    }

    const userId = decoded._id;

    // Check if refresh token exists in Redis
    const storedRefreshToken = await client.get(`user:${userId}:refreshToken`);
    if (storedRefreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        status: "Unauthorized",
        timestamp: new Date().toISOString(),
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: "Not Found",
        timestamp: new Date().toISOString(),
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      user.generateJWT();

    // Update refresh token in Redis
    await client.setEx(
      `user:${userId}:refreshToken`,
      7 * 24 * 60 * 60,
      newRefreshToken
    );

    return res.status(200).json({
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "Internal Server Error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
};

// @ Route : POST /api/auth/logout
// @ Desc : Logout a user
// @ Access : Protected Route
module.exports.logout = async (req, res) => {
  try {
    const { _id } = req.user;
    await client.del(`user:${_id}:refreshToken`);
    return res.status(200).json({
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "User logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "Internal Server Error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
};
