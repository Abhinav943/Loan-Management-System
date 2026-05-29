import jwt from "jsonwebtoken";
import { Types } from "mongoose";

export const generateAccessToken = (userId: Types.ObjectId, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: Types.ObjectId): string => {
  return jwt.sign(
    { id: userId }, 
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }
  );
};