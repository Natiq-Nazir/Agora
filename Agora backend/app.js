import express, { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import issueRouter from "./routes/issue.route.js";
import cors from "cors";

dotenv.config();
const app = express();
app.set("strict routing", false);
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());


app.use(cors({
  origin: "http://localhost:5173", // Permits your frontend port
  credentials: true                // Allows cookies/JWT tokens to pass through securely
}));

connectDatabase();
// testing git tracking
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/auth", authRouter);

app.use("/api/issues", issueRouter);



app.get("/protected", authMiddleware, (req, res) => {
  const user = req.user;
  res.json({ message: "This is a protected route", user });
});

app.listen(3000);
// testing git tracking