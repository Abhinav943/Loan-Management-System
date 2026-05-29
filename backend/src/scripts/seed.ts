import mongoose from "mongoose";
import dotenv from "dotenv";
import User, { UserRole } from "../models/user";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected for Seeding...");

    await User.deleteMany({});
    console.log("Cleared existing users.");

    const evaluatorPassword = "Password123!";

    const defaultUsers = [
      {
        fullName: "System Admin",
        email: "admin@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Admin,
      },
      {
        fullName: "Sales Executive",
        email: "sales@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Sales,
      },
      {
        fullName: "Sanction Executive",
        email: "sanction@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Sanction,
      },
      {
        fullName: "Disbursement Executive",
        email: "disbursement@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Disbursement,
      },
      {
        fullName: "Collection Executive",
        email: "collection@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Collection,
      },
      {
        fullName: "Test Borrower",
        email: "borrower@lms.com",
        passwordHash: evaluatorPassword,
        role: UserRole.Borrower,
      },
    ];

    for (const userData of defaultUsers) {
      await User.create(userData);
    }

    console.log("Database successfully seeded with evaluator credentials!");
    process.exit(0); 
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
