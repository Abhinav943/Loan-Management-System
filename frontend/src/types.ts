export interface Borrower {
  fullName?: string;
  email?: string;
}

export interface Payment {
  _id?: string;
  utrNumber: string;
  amount: number;
  paymentDate?: string;
  createdAt?: string;
}

export interface Loan {
  _id: string;
  borrowerId?: Borrower;
  pan?: string;
  loanAmount: number;
  tenure: number;
  totalRepayment: number;
  totalPaid?: number;
  remainingBalance?: number;
  payments?: Payment[];
  createdAt?: string;
  updatedAt?: string;

  panId?: string;
  monthlySalary?: number;
  employmentMode?: string;
  interestRate?: number;
  salarySlipUrl?: string;
}

export interface CelebrationInfo {
  borrowerName: string;
  amount: number;
}
