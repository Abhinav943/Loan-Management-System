import { Response } from "express";
import Loan, { LoanStatus } from "../models/loan";
import Payment from "../models/payment";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../middlewares/authMiddleware";
import { decryptData } from "../utils/encryption";

export const getPendingLoans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const loans = await Loan.find({ status: LoanStatus.Pending }).populate(
      "borrowerId",
      "fullName email"
    );

    const decryptedLoans = loans.map((loan) => {
      const loanObj = loan.toObject();
      loanObj.pan = decryptData(loanObj.pan);
      return loanObj;
    });

    res
      .status(200)
      .json(new ApiResponse(200, decryptedLoans, "Pending loans retrieved"));
  }
);

export const verifyLoan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { loanId } = req.params;
    const { status, rejectionReason } = req.body;

    if (![LoanStatus.Verified, LoanStatus.Rejected].includes(status)) {
      throw new ApiError(400, "Invalid status. Must be Verified or Rejected");
    }

    const loan = await Loan.findOne({
      _id: loanId,
      status: LoanStatus.Pending,
    });
    if (!loan) throw new ApiError(404, "Pending loan not found");

    loan.status = status;
    if (status === LoanStatus.Rejected && rejectionReason) {
      loan.rejectionReason = rejectionReason;
    }
    await loan.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, loan, `Loan successfully marked as ${status}`)
      );
  }
);


export const getVerifiedLoans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const loans = await Loan.find({ status: LoanStatus.Verified }).populate(
      "borrowerId",
      "fullName email"
    );
    res
      .status(200)
      .json(new ApiResponse(200, loans, "Verified loans retrieved"));
  }
);

export const sanctionLoan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { loanId } = req.params;
    const { status, rejectionReason } = req.body;

    if (![LoanStatus.Sanctioned, LoanStatus.Rejected].includes(status)) {
      throw new ApiError(400, "Invalid status. Must be Sanctioned or Rejected");
    }

    const loan = await Loan.findOne({
      _id: loanId,
      status: LoanStatus.Verified,
    });
    if (!loan) throw new ApiError(404, "Verified loan not found");

    loan.status = status;
    if (status === LoanStatus.Rejected && rejectionReason) {
      loan.rejectionReason = rejectionReason;
    }
    await loan.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, loan, `Loan successfully marked as ${status}`)
      );
  }
);

export const getSanctionedLoans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const loans = await Loan.find({ status: LoanStatus.Sanctioned }).populate(
      "borrowerId",
      "fullName email"
    );
    res
      .status(200)
      .json(new ApiResponse(200, loans, "Sanctioned loans retrieved"));
  }
);

export const disburseLoan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      status: LoanStatus.Sanctioned,
    });
    if (!loan) throw new ApiError(404, "Sanctioned loan not found");

    loan.status = LoanStatus.Disbursed;
    await loan.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, loan, "Funds transferred. Loan is now Disbursed.")
      );
  }
);

export const getDisbursedLoans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const loans = await Loan.find({ status: LoanStatus.Disbursed }).populate(
      "borrowerId",
      "fullName email"
    );
    
    const loansWithPayments = await Promise.all(
      loans.map(async (loan) => {
        const payments = await Payment.find({ loanId: loan._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...loan.toObject(),
          totalPaid,
          remainingBalance: Math.max(0, loan.totalRepayment - totalPaid),
          payments,
        };
      })
    );

    res
      .status(200)
      .json(new ApiResponse(200, loansWithPayments, "Active disbursed loans retrieved"));
  }
);

export const recordPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { loanId } = req.params;
    const { utrNumber, amount, paymentDate } = req.body;

    if (!utrNumber || !amount || amount <= 0) {
      throw new ApiError(400, "Valid UTR number and amount are required");
    }

    const loan = await Loan.findOne({
      _id: loanId,
      status: LoanStatus.Disbursed,
    });
    if (!loan) throw new ApiError(404, "Active disbursed loan not found");

    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      throw new ApiError(
        400,
        "A payment with this UTR has already been recorded"
      );
    }

    const payment = await Payment.create({
      loanId: loan._id,
      utrNumber,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: req.user?._id,
    });

    const allPayments = await Payment.find({ loanId: loan._id });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= loan.totalRepayment) {
      loan.status = LoanStatus.Closed;
      await loan.save();
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { payment, loanStatus: loan.status },
            "Payment recorded. Target met: Loan is now CLOSED."
          )
        );
    }

    res.status(201).json(
      new ApiResponse(
        201,
        {
          payment,
          totalPaid,
          remaining: loan.totalRepayment - totalPaid,
        },
        "Payment recorded successfully"
      )
    );
  }
);