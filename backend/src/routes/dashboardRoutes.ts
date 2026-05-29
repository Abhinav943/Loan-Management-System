import { Router } from "express";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { UserRole } from "../models/user";
import {
  getPendingLoans,
  verifyLoan,
  getVerifiedLoans,
  sanctionLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordPayment,
} from "../controllers/dashboardController";

const router = Router();

router.use(protect);

router.get(
  "/sales/pending",
  authorizeRoles(UserRole.Sales, UserRole.Admin),
  getPendingLoans
);
router.put(
  "/sales/verify/:loanId",
  authorizeRoles(UserRole.Sales, UserRole.Admin),
  verifyLoan
);


router.get(
  "/sanction/verified",
  authorizeRoles(UserRole.Sanction, UserRole.Admin),
  getVerifiedLoans
);
router.put(
  "/sanction/approve/:loanId",
  authorizeRoles(UserRole.Sanction, UserRole.Admin),
  sanctionLoan
);


router.get(
  "/disbursement/sanctioned",
  authorizeRoles(UserRole.Disbursement, UserRole.Admin),
  getSanctionedLoans
);
router.put(
  "/disbursement/disburse/:loanId",
  authorizeRoles(UserRole.Disbursement, UserRole.Admin),
  disburseLoan
);


router.get(
  "/collection/disbursed",
  authorizeRoles(UserRole.Collection, UserRole.Admin),
  getDisbursedLoans
);
router.post(
  "/collection/payment/:loanId",
  authorizeRoles(UserRole.Collection, UserRole.Admin),
  recordPayment
);

export default router;
