import { Response } from "express";
import Loan, { EmploymentMode, LoanStatus } from "../models/loan";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../middlewares/authMiddleware";

const calculateAge = (dob: string | Date): number => {
  const diffMs = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const applyForLoan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      pan,
      dob,
      monthlySalary,
      employmentMode,
      salarySlipUrl,
      loanAmount,
      tenure,
    } = req.body;

    if (
      !pan ||
      !dob ||
      !monthlySalary ||
      !employmentMode ||
      !salarySlipUrl ||
      !loanAmount ||
      !tenure
    ) {
      throw new ApiError(400, "All application fields are required");
    }

    const breErrors: string[] = [];

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      breErrors.push("Does not match valid PAN format");
    }

    const age = calculateAge(dob);
    if (age < 23 || age > 50) {
      breErrors.push(`Applicant age is ${age}. Must be between 23 and 50`);
    }

    if (monthlySalary < 25000) {
      breErrors.push("Salary is below 25,000/month");
    }

    if (employmentMode === EmploymentMode.Unemployed) {
      breErrors.push("Applicant is Unemployed");
    }

    if (breErrors.length > 0) {
      throw new ApiError(
        400,
        "Application Rejected by Business Rule Engine",
        breErrors,
      );
    }

    const existingLoan = await Loan.findOne({
      borrowerId: req.user?._id,
      status: {
        $in: [LoanStatus.Pending, LoanStatus.Sanctioned, LoanStatus.Disbursed],
      },
    });

    if (existingLoan) {
      throw new ApiError(
        400,
        "You already have an active loan application in progress",
      );
    }


    const interestRate = 12; 
    const simpleInterest = (loanAmount * interestRate * tenure) / (365 * 100);
    const totalRepayment = Math.round(loanAmount + simpleInterest); 

    const newLoan = await Loan.create({
      borrowerId: req.user?._id,
      pan,
      dob,
      monthlySalary,
      employmentMode,
      salarySlipUrl,
      loanAmount,
      tenure,
      interestRate,
      totalRepayment,
      status: LoanStatus.Pending,
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newLoan,
          "Loan application submitted successfully",
        ),
      );
  },
);

export const getMyLoans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const loans = await Loan.find({ borrowerId: req.user?._id }).sort({
      createdAt: -1,
    });

    res
      .status(200)
      .json(new ApiResponse(200, loans, "Loans retrieved successfully"));
  },
);
