import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.json({ message: "token not found", success: false });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res.json({ message: "invalid token", success: false });
    }

    const user = await User.findById(decode.id);
    if (!user) {
      return res.json({ message: "user not found", success: false });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.json({
      message: "invalid token",
      success: false,
      error: err,
    });
  }
};