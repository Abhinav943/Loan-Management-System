# Implementation Plan - Loan Management System Frontend (Direct Backend Integration)

This plan outlines the design and implementation details for building a complete, high-fidelity frontend for the Loan Management System (LMS) that connects directly to the existing Express/Node.js/MongoDB backend running at `http://localhost:5000` using Axios.

---

## User Review Required

> [!IMPORTANT]
> **Authentication & Token Interceptors**
> - The application will use a global Axios instance configured with `withCredentials: true`.
> - Access tokens are stored in the memory of a React Context (`AuthContext`).
> - We will implement a response interceptor that intercepts `401 Unauthorized` responses, calls `POST /api/auth/refresh` to fetch a new access token using the HTTP-only refresh cookie, updates the memory state, and retries the failed original request.
> - On page load, `AuthContext` will call `/api/auth/refresh` to check for an active session and keep the user logged in seamlessly.

> [!WARNING]
> **Minor Backend Bug Fixes Proposed**
> During investigation of the backend controllers in `backend/src/controllers/dashboardController.ts`, we discovered two validation bugs that would cause schema failures:
> 1. **Rejection Reason Missing**: The mongoose schema requires `rejectionReason` if a loan is marked as `Rejected`. However, the `verifyLoan` and `sanctionLoan` controllers only destructure `status` from `req.body`, causing a schema validation failure on save. We propose editing the backend to destructure and apply `rejectionReason`.
> 2. **Custom Payment Date Missing**: The `recordPayment` controller does not destructure `paymentDate` from the request, forcing all payments to the server's current timestamp instead of the date input in the frontend form. We propose updating the controller to accept a custom date.

---

## Proposed Changes

### 1. Backend Controller Bug Fixes
We will modify the backend files to ensure the API matches the dashboard specifications.

#### [MODIFY] [dashboardController.ts](file:///c:/Users/DELL/Projects/Loan%20Management%20System/backend/src/controllers/dashboardController.ts)
- Destructure `rejectionReason` in `verifyLoan` and `sanctionLoan`.
- Assign `rejectionReason` to the loan before saving.
- Destructure `paymentDate` in `recordPayment` and pass it to `Payment.create`.

### 2. Next.js Frontend Initialization
We will create a Next.js App Router project in the `frontend` folder:
```bash
npx -y create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

### 3. Frontend Architecture
We will install necessary dependencies in the `frontend` directory:
- `axios` (API requests)
- `lucide-react` (Dashboard icons)
- `framer-motion` (Micro-animations and transitions)
- `react-hot-toast` (Visual notification feedback)

#### [NEW] [api.ts](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/services/api.ts)
Create a global Axios instance pointing to `http://localhost:5000` with interceptors:
- Sets `Authorization: Bearer <token>` dynamically using the current token in memory.
- Intercepts `401` errors, triggers the refresh token call, saves the new access token, and replays the original request.

#### [NEW] [AuthContext.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/context/AuthContext.tsx)
State manager that stores:
- `user`: `{ id: string; role: string; fullName: string; email: string }`
- `accessToken`: `string | null`
- `loading`: `boolean`
Provides `login`, `signup`, `logout`, and client-side page protection guards based on role.

#### [NEW] [page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/page.tsx)
Landing redirect page. Detects authentication state and redirects:
- Guest -> `/login`
- Borrower -> `/borrower`
- Sales/Sanction/Disbursement/Collection/Admin -> `/dashboard` (which redirects to their appropriate sub-route)

#### [NEW] [login/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/login/page.tsx)
Authentication screen. Includes:
- Clean forms for Login & Signup.
- **Quick-Login Controls**: Visual badges to instantly log in as pre-seeded roles (`Admin`, `Sales`, `Sanction`, `Disbursement`, `Collection`, `Borrower`) with their credentials, speeding up the evaluation.

#### [NEW] [unauthorized/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/unauthorized/page.tsx)
A premium "Access Denied" page shown if a user manually inputs a route unauthorized for their role.

#### [NEW] [borrower/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/borrower/page.tsx)
The multi-step progress wizard:
- **Step 1: Welcome/Auth**: Displays user details if logged in; otherwise prompts login.
- **Step 2: Details**: Personal details with inline Business Rule Engine (BRE) error checks (Age 23–50, monthly salary >= 25k, PAN pattern `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`, employment mode != Unemployed).
- **Step 3: Upload**: Drag-and-drop file upload for `salarySlip` (stores local file object).
- **Step 4: Configure**: Interactive principal and tenure sliders with a live glassmorphic card calculating:
  $$\text{Interest} = \frac{\text{Principal} \times 12 \times \text{Tenure}}{365 \times 100}$$
  $$\text{Total Repayment} = \text{Principal} + \text{Interest}$$
- Clicking "Apply" creates a `FormData` object with the file appended under key `salarySlip` and POSTs to `/api/borrower/apply`.

#### [NEW] [dashboard/layout.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/dashboard/layout.tsx)
A beautiful sidebar layout with responsive mobile navigation drawers. Dynamically adjusts sidebar links based on the user's role:
- `Sales` -> Lead Tracking
- `Sanction` -> Review Panel
- `Disbursement` -> Fund Release
- `Collection` -> Repayment Panel
- `Admin` -> All modules visible

#### [NEW] [dashboard/sales/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/dashboard/sales/page.tsx)
Tracks pre-application leads. Displays loans in `Pending` status and provides a "Verify" action that calls the backend verify API (transitions status to `Verified`).

#### [NEW] [dashboard/sanction/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/dashboard/sanction/page.tsx)
Handles verified loans in `Verified` status. Clicking opens a details modal showing candidate info, a placeholder view of the uploaded salary slip, and loan config math. Contains "Approve" (transitions to `Sanctioned`) and "Reject" (prompts for rejection reason, transitions to `Rejected`).

#### [NEW] [dashboard/disbursement/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/dashboard/disbursement/page.tsx)
Displays sanctioned loans. Shows a "Mark as Disbursed" button that calls `/api/dashboard/disbursement/disburse/:loanId`.

#### [NEW] [dashboard/collection/page.tsx](file:///c:/Users/DELL/Projects/Loan%20Management%20System/frontend/src/app/dashboard/collection/page.tsx)
Displays disbursed loans. Computes outstanding balances:
$$\text{Remaining Balance} = \text{Total Repayment} - \sum \text{Payments}$$
Includes "Add Payment Record" form (UTR, Amount, Date). UTR numbers are checked for uniqueness on the client. Upon submission, if the loan is fully repaid, the system displays a status transition animation to `CLOSED`.

---

## Verification Plan

### Automated & Manual Verification
1. **Axios Token Interceptor Test**:
   - Manually reduce the JWT access token expiry to 5 seconds in the backend or wait for it to expire.
   - Perform an action in the dashboard (e.g. refresh the table).
   - Check the Network tab to confirm that:
     1. The request returns `401 Unauthorized`.
     2. The Axios interceptor immediately hits `/api/auth/refresh`.
     3. The original request is retried with the new access token and succeeds seamlessly.
2. **File Upload Verification**:
   - Apply for a loan with a PDF/PNG salary slip. Verify the backend uploads the file to Cloudinary and saves the URL.
3. **Role-Based Guards**:
   - Try to access `/dashboard` as a borrower -> verify redirection to `/unauthorized`.
   - Try to access `/dashboard/sanction` as a Sales executive -> verify redirection to `/unauthorized`.
4. **Backend Bug Resolution Verification**:
   - Trigger a rejection in the Sanction panel and ensure it successfully records the rejection reason in MongoDB without schema validation errors.
   - Add a payment record with a custom date and verify it is saved correctly in MongoDB.
