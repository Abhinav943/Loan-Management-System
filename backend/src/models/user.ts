import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export enum UserRole {
  Admin = "Admin",
  Sales = "Sales",
  Sanction = "Sanction",
  Disbursement = "Disbursement",
  Collection = "Collection",
  Borrower = "Borrower",
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.Borrower,
    },
  },
  {
    timestamps: true, 
  },
);

UserSchema.pre("save", async function () {
  const user = this as unknown as IUser;
  if (!user.isModified("passwordHash")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>("User", UserSchema);