import { Router } from "express";
import { applyForLoan, getMyLoans } from "../controllers/borrowerController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { UserRole } from "../models/user";
import { upload } from "../middlewares/multerMiddleware";

const router = Router();

router.use(protect);
router.use(authorizeRoles(UserRole.Borrower));

router.post("/apply", upload.single("salarySlip"), applyForLoan);
router.get("/my-loans", getMyLoans);

export default router;
