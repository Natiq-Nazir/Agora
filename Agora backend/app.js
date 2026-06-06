import express, { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

dotenv.config();
const app = express();
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

connectDatabase();
// testing git tracking
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/auth", authRouter);

app.get("/protected", authMiddleware, (req, res) => {
  const user = req.user;
  res.json({ message: "This is a protected route", user });
});

app.listen(3000);
