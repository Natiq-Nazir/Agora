// controllers/auth.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// ─── REGISTER ───────────────────────────────────────────────────────────────

export const registerUserController = async (req, res) => {
  try {
    const { email, password, role, batchNumber, district, state, department, jobTitle } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || "user",
      batchNumber,
      district,
      state,
      department,
      jobTitle,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    
    console.log("🔥 ACTUAL BACKEND ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Server error during registration."});
  }
};




// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const loginUserController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // 3. Sign JWT — role is explicitly baked into the payload here
    const token = jwt.sign(
      {
        id: user._id,       // used by authMiddleware for User.findById()
        role: user.role,    // used by authorizeRoles middleware — no extra DB call needed
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    // 5. Send role back to frontend explicitly so React state can route accordingly
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,        // frontend reads this to decide which dashboard to render
      },
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during login.", error: error.message });
  }
};


// ─── LOGOUT ─────────────────────────────────────────────────────────────────

export const logoutUserController = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};

