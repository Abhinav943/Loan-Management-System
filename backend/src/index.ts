import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import { errorHandler } from "./middlewares/errorMiddleware";

import authRoutes from "./routes/authRoutes"; 
import borrowerRoutes from "./routes/borrowerRoutes";

dotenv.config();
connectDB();

const app: Application = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, 
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/borrower", borrowerRoutes);

app.get("/", (req, res) => {
  res.send("LMS API is running...");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in development mode on port ${PORT}`);
});
