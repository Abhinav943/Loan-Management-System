import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true, 
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
