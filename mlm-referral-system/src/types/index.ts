import { Timestamp, FieldValue } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  lastActivity: Date;
  isAdmin: boolean;
  status: string;
  referralId: string;
  sponsorId: string | null;
  sponsorReferralId: string | null;
  // MLM specific fields
  directReferrals: number;
  totalTeamSize: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  level: number;
}

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  referralId: string;
  sponsorId: string | null;
  walletId: string;
  downlineCount: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalInvested: number;
  totalIncome: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  balance: number;
  level: number;
  status: string;
  lastLogin: Date;
  lastActivity: Date;
  phone?: string;
  address?: string;
  profilePicture?: string;
};

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: "deposit" | "withdrawal" | "level_commission" | "sponsor_commission" | "profit_share" | "unknown";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

export interface Referral {
  id: string;
  sponsorId: string;
  userId: string;
  level: number;
  createdAt: Date;
};

export type Wallet = {
  id: string;
  userId: string;
  totalInvested: number;
  totalIncome: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  balance: number;
  lastUpdated: Timestamp | FieldValue;
};

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  accountDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  processedAt?: Date | null;
  processedBy?: string;
  remarks?: string;
  transactionId?: string;
}

export type LevelCommission = {
  level: number;
  percentage: number;
};

export interface SystemSettings {
  id: string;
  sponsorCommissionPercentage: number;
  profitSharePercentage: number;
  levelCommissions: Array<{ level: number; percentage: number }>;
  minDepositAmount: number;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  lastUpdated: Date;
}

export interface DashboardData {
  totalUsers: number;
  totalWithdrawals: number;
  totalDeposits: number;
  totalCommissions: number;
  systemBalance: number;
  dailyTransactions: number;
  recentUsers: User[];
  recentWithdrawals: WithdrawalRequest[];
  recentDeposits: Transaction[];
}
