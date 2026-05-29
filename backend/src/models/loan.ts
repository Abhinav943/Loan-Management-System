import mongoose, { Schema, Document } from "mongoose";

export enum EmploymentMode {
  Salaried = "Salaried",
  SelfEmployed = "Self-Employed",
  Unemployed = "Unemployed",
}

export enum LoanStatus {
  Pending = "Pending",
  Verified = "Verified",
  Sanctioned = "Sanctioned",
  Disbursed = "Disbursed",
  Rejected = "Rejected",
  Closed = "Closed",
}

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;

  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;

  salarySlipUrl: string;

  loanAmount: number;
  tenure: number; 
  interestRate: number; 
  totalRepayment: number; 

  status: LoanStatus;
  rejectionReason?: string; 

  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema = new Schema(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // TODO: In a production environment, implement field-level two-way AES encryption for the PAN to protect Personally Identifiable Information (PII).
    pan: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
    },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
      required: true,
    },
    salarySlipUrl: {
      type: String,
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenure: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      required: true,
      default: 12,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.Pending,
      required: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      required: function (this: ILoan) {
        return this.status === LoanStatus.Rejected;
      },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<ILoan>("Loan", LoanSchema);
