import { Timestamp, FieldValue } from "firebase/firestore";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Timestamp;
  link?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  id: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  status: string;
  referralId: string;
  sponsorId: string | null;
  sponsorReferralId: string | null;
  directReferrals: number;
  totalTeamSize: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  level: number;
  balance: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  lastActivity: Timestamp;
  unreadNotifications: number;
  achievements: Achievement[];
  points: number;
  rank: string;
  role?: string;
  avatar?: string;
  photoURL?: string;
  address?: string;
  profilePicture?: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    accountHolderName: string;
  };
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  totalInvested: number;
  totalIncome: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  balance: number;
  level: number;
  status: string;
  lastLogin: Timestamp;
  lastActivity: Timestamp;
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
  createdAt: Timestamp;
  processedAt: Timestamp | null;
}

export interface Referral {
  id: string;
  sponsorId: string;
  userId: string;
  level: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  totalInvested: number;
  levelIncome: number;
  sponsorIncome: number;
  profitShare: number;
  lastUpdated: Timestamp | FieldValue;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  createdAt: Timestamp;
  processedAt: Timestamp | null;
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
  lastUpdated: Timestamp;
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
