import { Router } from "express";
import { applyForLoan, getMyLoans } from "../controllers/borrowerController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { UserRole } from "../models/user";

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.Borrower));

router.post("/apply", applyForLoan);
router.get("/my-loans", getMyLoans);

export default router;
