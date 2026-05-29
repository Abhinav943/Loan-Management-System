import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import User, { IUser } from "../models/user";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, no access token provided");
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
      ) as { id: string; role: string };

      const user = await User.findById(decoded.id).select("-passwordHash");

      if (!user) {
        throw new ApiError(
          401,
          "The user belonging to this token no longer exists",
        );
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, "Not authorized, token failed or expired");
    }
  },
);

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user?.role}' is not authorized to access this route`,
      );
    }

    next();
  };
};
