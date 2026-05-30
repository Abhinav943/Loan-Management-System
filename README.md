# Loan Management System (LMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)](backend)
[![Database](https://img.shields.io/badge/Database-MongoDB-%234ea94b)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg?logo=typescript)](https://www.typescriptlang.org/)

A full-stack Loan Management System built to manage the complete loan lifecycle from borrower onboarding to payout and collections. This project includes a multi-role web app with secure authentication, role-based dashboards, loan workflow automation, file upload support, and PII encryption.

---

## 🌟 Project Overview

This system supports the following roles:

* **Borrower** – submits loan applications and uploads supporting documents.
* **Sales** – reviews and verifies borrower applications.
* **Sanction** – approves verified loan requests.
* **Disbursement** – releases approved funds to borrowers.
* **Collection** – records repayments and closes loans when fully repaid.
* **Admin** – manages users, monitors all workflows, and oversees the system.

The app is built as a Next.js frontend with an Express + MongoDB backend. It uses JWT-based authentication with refresh tokens, secure file uploads via Cloudinary, and AES encryption for sensitive borrower data.

---

## 🚀 Key Features

* Role-based access control for borrower and loan operations
* Multi-step borrower loan application workflow
* Dynamic loan calculations with interest and repayment tracking
* Automated loan status updates from `Pending` → `Verified` → `Approved` → `Disbursed` → `Collecting` → `Closed`
* Secure dual-token authentication using JWT access + refresh tokens
* HttpOnly cookie storage for refresh token security
* Cloudinary-backed document upload for salary slips and proof files
* AES-256 encryption for sensitive fields such as PAN
* Centralized backend error handling and middleware validation
* Real-time dashboard summaries for each loan processing role
* Demo-ready seed data and quick login support

---

## 📁 Repository Structure

```text
backend/
  package.json
  tsconfig.json
  src/
    index.ts
    config/db.ts
    controllers/
    middlewares/
    models/
    routes/
    utils/
    scripts/seed.ts
frontend/
  package.json
  tsconfig.json
  src/
    app/
    context/
    services/
```

---

## 🧠 How It Works

### Borrower Flow

1. Borrower logs in and completes a loan application.
2. The frontend validates inputs and uploads documents to Cloudinary.
3. The backend stores the loan request and borrower metadata in MongoDB.
4. The application enters the workflow and appears for Sales review.

### Sales, Sanction, Disbursement, Collection Flow

1. Sales reviews pending loans and verifies documents.
2. Sanction approves verified loans based on business rules.
3. Disbursement releases funds for approved loans.
4. Collection logs repayments and automatically closes loans when the total amount is fully paid.

### Business Rules

* Borrower age must fall within configured limits.
* Minimum salary requirement must be met.
* PAN and other submitted data are validated before approval.
* Loan status transitions are enforced in the backend.

---

## 🛠️ Tech Stack

**Frontend**
* Next.js App Router
* React
* Tailwind CSS
* Axios
* Lucide React icons
* React Hot Toast

**Backend**
* Node.js
* Express
* MongoDB + Mongoose
* JWT authentication
* Multer + Cloudinary file uploads
* Node `crypto` for AES encryption

---

## ⚙️ Local Setup

### Prerequisites

* Node.js 18 or newer
* MongoDB running locally or via Atlas
* Cloudinary account for file uploads

### Backend Setup

1. Open a terminal and navigate to `backend`
2. Install dependencies:

```bash
cd backend
npm install
```

3. Create `.env` with the following values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loan_management
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
ENCRYPTION_KEY=32_character_secret_key_here
```

4. Start the backend server:

```bash
npm run dev
```

### Frontend Setup

1. Open another terminal and navigate to `frontend`
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Create `.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the frontend:

```bash
npm run dev
```

Launch the web app at `http://localhost:3000`.

---

## 🧪 Demo Accounts

Use these example credentials to exercise each role quickly. Password for all accounts is `Password123!` unless otherwise configured.

| Role | Email | Login Route |
|------|-------|-------------|
| Borrower | `borrower@lms.com` | `/borrower` |
| Sales | `sales@lms.com` | `/dashboard/sales` |
| Sanction | `sanction@lms.com` | `/dashboard/sanction` |
| Disbursement | `disbursement@lms.com` | `/dashboard/disbursement` |
| Collection | `collection@lms.com` | `/dashboard/collection` |
| Admin | `admin@lms.com` | full access |

---

## 📌 Notes

* Ensure MongoDB is running before starting the backend.
* Cloudinary credentials are required for borrower file uploads.
* The backend seed script can be used to provision initial demo users and loan roles.

---

## 📄 License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
