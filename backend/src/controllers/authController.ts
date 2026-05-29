import { Request, Response } from "express";
import User, { UserRole, IUser } from "../models/user";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import jwt from "jsonwebtoken";

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    const { checkEmail, checkPassword } = await import("@abhinav943/zynex");

    const emailResult = await checkEmail(email)
      .checkSyntax()
      .checkDisposable()
      .checkRoleBased()
      .checkTypos()
      .checkDNS()
      .executeAsync();

    if (!emailResult.isValid) {
      const emailErrors = emailResult.errors.map((err: any) => err.message);
      throw new ApiError(400, "Invalid email address", emailErrors);
    }

    const passwordResult = checkPassword(password)
      .minLength(8)
      .hasUppercase()
      .hasLowercase()
      .hasNumber()
      .hasSpecialChar()
      .hasNoSpaces()
      .execute();

    if (!passwordResult.isValid) {
      const passwordErrors = passwordResult.errors.map(
        (err: any) => err.message,
      );
      throw new ApiError(
        400,
        "Password does not meet security requirements",
        passwordErrors,
      );
    }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists with this email");
  }

  const user = await User.create({
    fullName,
    email,
    passwordHash: password,
    role: UserRole.Borrower,
  });

  const accessToken = generateAccessToken(user._id as any, user.role);
  const refreshToken = generateRefreshToken(user._id as any);

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessToken,
      },
      "User registered successfully",
    ),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = (await User.findOne({ email })) as IUser | null;

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id as any, user.role);
  const refreshToken = generateRefreshToken(user._id as any);

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessToken,
      },
      "Logged in successfully",
    ),
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    throw new ApiError(401, "No cookies found, please login again");
  }

  const refreshToken = cookies.split("jwt=")[1]?.split(";")[0];

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    const accessToken = generateAccessToken(user._id as any, user.role);

    res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken }, "Token refreshed successfully"),
      );
  } catch (error) {
    throw new ApiError(403, "Invalid or expired refresh token");
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});
