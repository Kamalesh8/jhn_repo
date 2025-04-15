import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  serverTimestamp,
  increment,
  documentId,
  FieldValue,
  DocumentSnapshot
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  type User,
  type Transaction,
  type Wallet,
  type Referral,
  type WithdrawalRequest,
  type SystemSettings,
  LevelCommission,
  type DashboardData
} from "../types";

// Helper function to convert Firestore timestamp to Date
export function convertTimestampToDate<T extends Record<string, any>>(
  doc: QueryDocumentSnapshot<DocumentData>
): T {
  const data = doc.data();
  const result: Record<string, any> = {
    ...data,
    id: doc.id,
  };

  // Convert all Timestamp fields to Date objects
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });

  return result as T;
}

// Helper function to convert Date to Timestamp
function dateToTimestamp(date: Date | null | undefined): Timestamp {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return Timestamp.now();
}

// Helper function to convert Timestamp to Date
function timestampToDate(timestamp: Timestamp | null | undefined): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date();
}

// Helper function to convert document data
export function convertDocData<T>(doc: any): T {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
  } as T;
}

// Helper function to convert document data to User type
function convertToUser(doc: DocumentSnapshot<DocumentData>): User {
  const data = doc.data();
  if (!data) {
    throw new Error("Document data is undefined");
  }
  return {
    id: doc.id,
    name: data.name || "",
    displayName: data.displayName || data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    isAdmin: data.isAdmin || false,
    status: data.status || "active",
    referralId: data.referralId || "",
    sponsorId: data.sponsorId || null,
    sponsorReferralId: data.sponsorReferralId || null,
    directReferrals: data.directReferrals || 0,
    totalTeamSize: data.totalTeamSize || 0,
    levelIncome: data.levelIncome || 0,
    sponsorIncome: data.sponsorIncome || 0,
    profitShare: data.profitShare || 0,
    level: data.level || 0,
    balance: data.balance || 0,
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
    lastLogin: data.lastLogin || Timestamp.now(),
    lastActivity: data.lastActivity || Timestamp.now(),
    unreadNotifications: data.unreadNotifications || 0,
    achievements: data.achievements || [],
    points: data.points || 0,
    rank: data.rank || "Beginner",
    role: data.role,
    avatar: data.avatar,
    photoURL: data.photoURL,
    address: data.address,
    profilePicture: data.profilePicture,
    bankDetails: data.bankDetails || {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      accountHolderName: ""
    }
  };
}

// Helper function to convert document data to Transaction type
function convertToTransaction(doc: DocumentSnapshot<DocumentData>): Transaction {
  const data = doc.data();
  if (!data) {
    throw new Error("Document data is undefined");
  }
  return {
    id: doc.id,
    userId: data.userId || "",
    userName: data.userName || "",
    type: data.type || "unknown",
    amount: data.amount || 0,
    description: data.description || "",
    status: data.status || "pending",
    createdAt: data.createdAt || Timestamp.now(),
    processedAt: data.processedAt || null
  };
}

// Helper function to convert document data to WithdrawalRequest type
function convertToWithdrawalRequest(doc: DocumentSnapshot<DocumentData>): WithdrawalRequest {
  const data = doc.data();
  if (!data) {
    throw new Error("Document data is undefined");
  }
  return {
    id: doc.id,
    userId: data.userId || "",
    userName: data.userName || "",
    userEmail: data.userEmail || "",
    amount: data.amount || 0,
    accountDetails: data.accountDetails || {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      accountHolderName: ""
    },
    status: data.status || "pending",
    createdAt: timestampToDate(data.createdAt),
    processedAt: timestampToDate(data.processedAt),
    processedBy: data.processedBy || null,
    remarks: data.remarks || null,
    transactionId: data.transactionId || null
  };
}

// User related services
export async function getUserByReferralId(referralId: string): Promise<User | null> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralId", "==", referralId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return convertToUser(querySnapshot.docs[0]);
  } catch (error) {
    console.error("Error getting user by referral ID:", error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return convertToUser(userDoc);
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

// Wallet services
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  try {
    const walletsRef = collection(db, "wallets");
    const q = query(walletsRef, where("userId", "==", userId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return convertDocData<Wallet>(snapshot.docs[0]);
  } catch (error) {
    console.error("Error getting wallet:", error);
    throw error;
  }
}

export async function updateWallet(wallet: Wallet): Promise<void> {
  try {
    const walletRef = doc(db, "wallets", wallet.id);
    await updateDoc(walletRef, {
      ...wallet,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating wallet:", error);
    throw error;
  }
}

// Transaction services
export async function createTransaction(
  userId: string,
  userName: string,
  type: string,
  amount: number,
  description: string
): Promise<Transaction> {
  try {
    const transactionData = {
      userId,
      userName,
      type,
      amount,
      description,
      status: "completed",
      createdAt: Timestamp.now(),
      processedAt: Timestamp.now()
    };

    const transactionRef = await addDoc(collection(db, "transactions"), transactionData);
    const doc = await getDoc(transactionRef);
    return convertToTransaction(doc);
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

// Cache for transactions
const transactionsCache = new Map<string, { data: Transaction[]; timestamp: number }>();
const TRANSACTIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  // Check cache first
  const cached = transactionsCache.get(userId);
  const now = Date.now();
  if (cached && now - cached.timestamp < TRANSACTIONS_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(100) // Limit to last 100 transactions to reduce quota usage
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => convertToTransaction(doc));
    
    // Update cache
    transactionsCache.set(userId, { data: transactions, timestamp: now });
    return transactions;
  } catch (error: any) {
    console.error("Error getting transactions:", error);
    
    // If quota exceeded, return cached data if available
    if (error.code === 'resource-exhausted' && cached) {
      console.log('Using cached transactions due to quota limit');
      return cached.data;
    }
    
    // If no cache and quota exceeded, return empty array with a specific error
    if (error.code === 'resource-exhausted') {
      console.log('No cached data available and quota exceeded');
      return [];
    }
    
    throw error;
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertToTransaction(doc));
  } catch (error) {
    console.error("Error getting all transactions:", error);
    throw error;
  }
}

// Referral services
export async function createReferral(userId: string, sponsorId: string | null): Promise<void> {
  try {
    if (!sponsorId) {
      return; // No sponsor, no referral needed
    }

    const referralRef = doc(collection(db, "referrals"));
    await setDoc(referralRef, {
      id: referralRef.id,
      sponsorId: sponsorId,
      userId: userId,
      level: 1,
      createdAt: serverTimestamp()
    });

    // Update sponsor's team size
    await updateTeamSize(sponsorId);
  } catch (error) {
    console.error("Error creating referral:", error);
    throw error;
  }
}

export async function getReferralsByUserId(userId: string): Promise<Referral[]> {
  try {
    const referralsRef = collection(db, "referrals");
    const q = query(
      referralsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => convertDocData<Referral>(doc));
  } catch (error) {
    console.error("Error getting referrals:", error);
    throw error;
  }
}

// Function to update user's team size recursively
export async function updateTeamSize(userId: string, cache = new Map<string, number>()): Promise<number> {
  try {
    // Check cache first
    if (cache.has(userId)) {
      return cache.get(userId)!;
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`User ${userId} not found`);
      return 0;
    }

    // Get direct referrals
    const referralsRef = collection(db, "referrals");
    const referralsQuery = query(referralsRef, where("sponsorId", "==", userId));
    const referralsSnapshot = await getDocs(referralsQuery);
    const directReferrals = referralsSnapshot.docs.length;
    const downlineUsers = referralsSnapshot.docs.map(doc => doc.data().userId);

    // Calculate total team size by recursively getting downline sizes
    let totalTeamSize = directReferrals;
    const updatePromises: Promise<number>[] = [];

    for (const downlineId of downlineUsers) {
      updatePromises.push(updateTeamSize(downlineId, cache));
    }

    const downlineSizes = await Promise.all(updatePromises);
    totalTeamSize += downlineSizes.reduce((sum, size) => sum + size, 0);

    // Cache the result
    cache.set(userId, totalTeamSize);

    // Update user's team size
    await updateDoc(userRef, {
      totalTeamSize,
      directReferrals,
      updatedAt: serverTimestamp()
    });

    return totalTeamSize;
  } catch (error) {
    console.error("Error updating team size:", error);
    throw error;
  }
}

// Cache for downline users
const downlineUsersCache = new Map<string, { users: User[]; timestamp: Timestamp }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get direct downline users for a user
export async function getDownlineUsers(userId: string, retryCount = 0): Promise<User[]> {
  // Check cache first
  const cachedData = downlineUsersCache.get(userId);
  if (cachedData) {
    const now = Timestamp.now();
    if (now.toMillis() - cachedData.timestamp.toMillis() < CACHE_DURATION) {
      return cachedData.users;
    }
  }

  try {
    // Get referrals where sponsorId matches userId
    const referralsRef = collection(db, "referrals");
    const q = query(referralsRef, where("sponsorId", "==", userId));
    const referralDocs = await getDocs(q);

    // Extract user IDs from referrals
    const userIds = referralDocs.docs.map(doc => doc.data().userId);

    // If no referrals found, return empty array
    if (userIds.length === 0) {
      return [];
    }

    // Get user documents for all referral user IDs
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where(documentId(), "in", userIds));
    const userDocs = await getDocs(userQuery);

    const users = userDocs.docs.map(doc => convertToUser(doc));

    // Update cache
    downlineUsersCache.set(userId, { users, timestamp: Timestamp.now() });

    return users;
  } catch (error) {
    console.error("Error getting downline users:", error);
    
    // Implement exponential backoff for retries
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return getDownlineUsers(userId, retryCount + 1);
    }
    
    throw error;
  }
}

// Function to get all downline users for a user (including indirect downlines)
export async function getAllDownlineUsers(userId: string): Promise<User[]> {
  const allUsers = new Set<User>();
  const processedIds = new Set<string>();

  async function processUser(id: string) {
    if (processedIds.has(id)) {
      return;
    }

    processedIds.add(id);
    const users = await getDownlineUsers(id);

    for (const user of users) {
      allUsers.add(user);
      await processUser(user.id);
    }
  }

  await processUser(userId);
  return Array.from(allUsers);
}

// Withdrawal request services
export async function getWithdrawalRequestsByUserId(userId: string): Promise<WithdrawalRequest[]> {
  try {
    const q = query(
      collection(db, "withdrawalRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => convertToWithdrawalRequest(doc));
  } catch (error) {
    console.error("Error getting withdrawal requests:", error);
    throw error;
  }
}

// Function to create withdrawal request
export async function createWithdrawalRequest(
  userId: string,
  userName: string,
  userEmail: string,
  amount: number,
  accountDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    accountHolderName: string;
  }
): Promise<WithdrawalRequest> {
  try {
    const withdrawalData = {
      userId,
      userName,
      userEmail,
      amount,
      accountDetails,
      status: "pending",
      createdAt: Timestamp.now(),
      processedAt: null,
      processedBy: null,
      remarks: null,
      transactionId: null
    };

    const withdrawalRef = await addDoc(collection(db, "withdrawalRequests"), withdrawalData);
    const doc = await getDoc(withdrawalRef);
    return convertToWithdrawalRequest(doc);
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    throw error;
  }
}

// Function to update withdrawal request
export async function updateWithdrawalRequest(
  requestId: string,
  status: string,
  remarks: string,
  processedBy: string
): Promise<void> {
  try {
    const withdrawalRef = doc(db, "withdrawalRequests", requestId);
    await updateDoc(withdrawalRef, {
      status,
      remarks,
      processedBy,
      processedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    throw error;
  }
}

// Function to get all withdrawal requests
export async function getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    const q = query(
      collection(db, "withdrawalRequests"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertToWithdrawalRequest(doc));
  } catch (error) {
    console.error("Error getting all withdrawal requests:", error);
    throw error;
  }
}

// Admin dashboard services
export async function getDashboardData(): Promise<DashboardData> {
  try {
    // Get total users
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;

    // Get recent users with sponsor info
    const recentUsersQuery = query(
      usersRef,
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    
    // Create a map of user IDs to user data for quick lookup
    const userMap = new Map<string, User>();
    const allUsersSnapshot = await getDocs(usersRef);
    allUsersSnapshot.docs.forEach(doc => {
      const userData = doc.data() as User;
      userMap.set(doc.id, {
        ...userData,
        id: doc.id
      });
    });

    const recentUsers = recentUsersSnapshot.docs.map(doc => {
      const userData = doc.data() as User;
      const sponsorName = userData.sponsorId ? 
        userMap.get(userData.sponsorId)?.name || "Unknown Sponsor" : 
        "Direct Registration";

      return {
        ...userData,
        id: doc.id,
        sponsorName: sponsorName,
        createdAt: timestampToDate(userData.createdAt),
        updatedAt: timestampToDate(userData.updatedAt),
        lastLogin: timestampToDate(userData.lastLogin),
        lastActivity: timestampToDate(userData.lastActivity),
      } as User;
    });

    // Get total deposits
    const depositsRef = collection(db, "transactions");
    const depositsSnapshot = await getDocs(
      query(depositsRef, where("type", "==", "deposit"))
    );
    const totalDeposits = depositsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get total withdrawals
    const withdrawalsRef = collection(db, "withdrawalRequests");
    const withdrawalsSnapshot = await getDocs(
      query(withdrawalsRef, where("status", "==", "completed"))
    );
    const totalWithdrawals = withdrawalsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get total commissions
    const commissionsRef = collection(db, "transactions");
    const commissionsSnapshot = await getDocs(
      query(commissionsRef, where("type", "==", "commission"))
    );
    const totalCommissions = commissionsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    // Get system balance
    const systemBalance = totalDeposits - totalWithdrawals - totalCommissions;

    // Get daily transactions
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dailyTransactionsRef = collection(db, "transactions");
    const dailyTransactionsSnapshot = await getDocs(
      query(
        dailyTransactionsRef,
        where("createdAt", ">=", oneDayAgo)
      )
    );
    const dailyTransactions = dailyTransactionsSnapshot.docs.length;

    // Get recent withdrawals
    const recentWithdrawalsQuery = query(
      withdrawalsRef,
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const recentWithdrawalsSnapshot = await getDocs(recentWithdrawalsQuery);
    const recentWithdrawals = recentWithdrawalsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "Unknown User",
        userEmail: data.userEmail || "",
        amount: data.amount || 0,
        accountDetails: data.accountDetails || {},
        status: data.status || "pending",
        createdAt: timestampToDate(data.createdAt),
        processedAt: timestampToDate(data.processedAt),
        processedBy: data.processedBy || "",
        remarks: data.remarks || "",
        transactionId: data.transactionId || ""
      } as WithdrawalRequest;
    });

    // Get recent deposits
    const recentDepositsQuery = query(
      depositsRef,
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const recentDepositsSnapshot = await getDocs(recentDepositsQuery);
    const recentDeposits = recentDepositsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "Unknown User",
        type: data.type || "unknown",
        amount: data.amount || 0,
        description: data.description || "",
        status: data.status || "pending",
        createdAt: timestampToDate(data.createdAt)
      } as Transaction;
    });

    return {
      totalUsers,
      totalWithdrawals,
      totalDeposits,
      totalCommissions,
      systemBalance,
      dailyTransactions,
      recentUsers,
      recentWithdrawals,
      recentDeposits
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

// Function to update user
export async function updateUser(userId: string, updateData: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Function to create user
export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    const userRef = collection(db, "users");
    const now = Timestamp.now();
    const newUserData = {
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      lastActivity: now,
      isAdmin: false,
      status: "active",
      directReferrals: 0,
      totalTeamSize: 0,
      levelIncome: 0,
      sponsorIncome: 0,
      profitShare: 0,
      level: 0,
      balance: 0,
      unreadNotifications: 0,
      achievements: [],
      points: 0,
      rank: "Beginner"
    };

    const docRef = await addDoc(userRef, newUserData);
    const userDoc = await getDoc(docRef);
    return convertToUser(userDoc);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
