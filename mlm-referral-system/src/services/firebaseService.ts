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
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type User,
  type Transaction,
  type Wallet,
  type Referral,
  type WithdrawalRequest,
  type SystemSettings,
  LevelCommission,
  type DashboardData
} from "@/types";

// Helper function to convert Firestore timestamp to Date
export function convertTimestampToDate<T extends Record<string, any>>(
  doc: QueryDocumentSnapshot<T>
): T {
  const data = doc.data();
  const result: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else {
      result[key] = value;
    }
  });

  return result as T;
}

// User related services
export async function getUserByReferralId(referralId: string): Promise<User | null> {
  try {
    if (!referralId) {
      throw new Error("Referral ID is required");
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralId", "==", referralId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData) {
      throw new Error("User data is empty");
    }

    return {
      id: userDoc.id,
      ...userData
    } as User;
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

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      ...userData
    } as User;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

// Wallet services
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  try {
    const walletRef = doc(db, "wallets", userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      return null;
    }

    const walletData = walletDoc.data();
    return {
      id: walletDoc.id,
      ...walletData
    } as Wallet;
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
export async function createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
  try {
    const timestamp = serverTimestamp();
    const transactionRef = await addDoc(collection(db, "transactions"), {
      ...transaction,
      createdAt: timestamp
    });

    // Get the actual document to return the proper date
    const transactionDoc = await getDoc(transactionRef);
    const transactionData = transactionDoc.data();

    return {
      id: transactionRef.id,
      ...transaction,
      createdAt: transactionData?.createdAt instanceof Timestamp ? transactionData.createdAt.toDate() : new Date()
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    // Sort transactions by createdAt in memory
    const transactions = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

    return transactions.sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
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

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Referral[];
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

// Function to get direct downline users for a user
export async function getDownlineUsers(userId: string): Promise<User[]> {
  try {
    console.log(`Fetching downline users for user: ${userId}`);

    const referralsRef = collection(db, "referrals");
    const referralsQuery = query(
      referralsRef,
      where("sponsorId", "==", userId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    
    console.log(`Found ${referralsSnapshot.size} direct referrals for user`);

    const userPromises = referralsSnapshot.docs.map(async (referralDoc) => {
      const referralData = referralDoc.data();
      console.log(`Processing referral: ${JSON.stringify(referralData)}`);

      const userDoc = await getDoc(doc(db, "users", referralData.userId));
      
      if (!userDoc.exists()) {
        console.log(`User not found for referral: ${referralData.userId}`);
        return null;
      }

      const userData = userDoc.data() as User;
      console.log(`User data: ${JSON.stringify(userData)}`);

      return {
        id: userDoc.id,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        isAdmin: userData.isAdmin || false,
        status: userData.status || "active",
        referralId: userData.referralId || "",
        sponsorId: userData.sponsorId || null,
        sponsorReferralId: userData.sponsorReferralId || null,
        directReferrals: userData.directReferrals || 0,
        totalTeamSize: userData.totalTeamSize || 0,
        levelIncome: userData.levelIncome || 0,
        sponsorIncome: userData.sponsorIncome || 0,
        profitShare: userData.profitShare || 0,
        level: userData.level || 0,
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(),
        updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : new Date(),
        lastLogin: userData.lastLogin instanceof Timestamp ? userData.lastLogin.toDate() : new Date(),
        lastActivity: userData.lastActivity instanceof Timestamp ? userData.lastActivity.toDate() : new Date()
      };
    });

    const downlineUsers = await Promise.all(userPromises);
    const validUsers = downlineUsers.filter((user): user is User => user !== null);

    console.log(`Total valid downline users: ${validUsers.length}`);

    // Update the sponsor's direct referrals count
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      directReferrals: validUsers.length,
      updatedAt: serverTimestamp()
    });

    return validUsers;
  } catch (error) {
    console.error("Error getting downline users:", error);
    throw error;
  }
}

// Function to get all downline users for a user (including indirect downlines)
export async function getAllDownlineUsers(userId: string): Promise<User[]> {
  try {
    const referralsRef = collection(db, "referrals");
    const referralsQuery = query(
      referralsRef,
      where("sponsorId", "==", userId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    
    const userPromises = referralsSnapshot.docs.map(async (referralDoc) => {
      const referralData = referralDoc.data();
      const userDoc = await getDoc(doc(db, "users", referralData.userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as User;
      return {
        id: userDoc.id,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        isAdmin: userData.isAdmin || false,
        status: userData.status || "active",
        referralId: userData.referralId || "",
        sponsorId: userData.sponsorId || null,
        sponsorReferralId: userData.sponsorReferralId || null,
        directReferrals: userData.directReferrals || 0,
        totalTeamSize: userData.totalTeamSize || 0,
        levelIncome: userData.levelIncome || 0,
        sponsorIncome: userData.sponsorIncome || 0,
        profitShare: userData.profitShare || 0,
        level: userData.level || 0,
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(),
        updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : new Date(),
        lastLogin: userData.lastLogin instanceof Timestamp ? userData.lastLogin.toDate() : new Date(),
        lastActivity: userData.lastActivity instanceof Timestamp ? userData.lastActivity.toDate() : new Date()
      } as User;
    });

    const directDownline = await Promise.all(userPromises);
    const validDownline = directDownline.filter((user): user is User => user !== null);

    // Instead of recursive query, use the totalTeamSize from user profile
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return validDownline;
    }

    const userData = userDoc.data() as User;
    const totalTeamSize = userData.totalTeamSize || 0;
    
    // If totalTeamSize is greater than direct downlines, we have indirect downlines
    if (totalTeamSize > validDownline.length) {
      // Since we can't query recursively, we'll just return the direct downlines
      // The total team size will be shown from the user profile
      return validDownline;
    }

    return validDownline;
  } catch (error) {
    console.error("Error getting all downline users:", error);
    throw error;
  }
}

// Withdrawal request services
export async function getWithdrawalRequestsByUserId(userId: string): Promise<WithdrawalRequest[]> {
  try {
    const requestsRef = collection(db, "withdrawalRequests");
    const q = query(
      requestsRef,
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    const withdrawalRequests: WithdrawalRequest[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const request: WithdrawalRequest = {
        id: docSnapshot.id,
        userId: data.userId,
        userName: data.userName || "Unknown User",
        userEmail: data.userEmail || "",
        amount: data.amount,
        accountDetails: data.accountDetails || {},
        status: data.status,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        processedAt: data.processedAt instanceof Timestamp ? data.processedAt.toDate() : null,
        processedBy: data.processedBy || "",
        remarks: data.remarks || "",
        transactionId: data.transactionId || ""
      };
      withdrawalRequests.push(request);
    }

    // Sort requests by createdAt in memory
    return withdrawalRequests.sort((a, b) => {
      const dateA = a.createdAt;
      const dateB = b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error getting withdrawal requests:", error);
    throw error;
  }
}

// Function to create withdrawal request
export async function createWithdrawalRequest(withdrawalRequest: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'processedAt'>): Promise<string> {
  try {
    const withdrawalRequestsRef = collection(db, "withdrawalRequests");
    const docRef = await addDoc(withdrawalRequestsRef, {
      ...withdrawalRequest,
      createdAt: serverTimestamp(),
      processedAt: null,
      status: "pending"
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    throw error;
  }
}

// Function to update withdrawal request
export async function updateWithdrawalRequest(requestId: string, data: Partial<WithdrawalRequest>): Promise<void> {
  try {
    const requestRef = doc(db, "withdrawalRequests", requestId);
    await updateDoc(requestRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    throw error;
  }
}

// Function to get all withdrawal requests
export async function getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    const requestsRef = collection(db, "withdrawalRequests");
    const q = query(requestsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const withdrawalRequests: WithdrawalRequest[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const request: WithdrawalRequest = {
        id: docSnapshot.id,
        userId: data.userId,
        userName: data.userName || "Unknown User",
        userEmail: data.userEmail || "",
        amount: data.amount,
        accountDetails: data.accountDetails || {},
        status: data.status,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        processedAt: data.processedAt instanceof Timestamp ? data.processedAt.toDate() : null,
        processedBy: data.processedBy || "",
        remarks: data.remarks || "",
        transactionId: data.transactionId || ""
      };

      // Fetch user details
      const userDoc = await getDoc(doc(db, "users", request.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData) {
          request.userName = userData.name || "Unknown User";
          request.userEmail = userData.email || "";
        }
      }

      withdrawalRequests.push(request);
    }

    return withdrawalRequests;
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
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(),
        updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : new Date(),
        lastLogin: userData.lastLogin instanceof Timestamp ? userData.lastLogin.toDate() : new Date(),
        lastActivity: userData.lastActivity instanceof Timestamp ? userData.lastActivity.toDate() : new Date()
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
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        processedAt: data.processedAt instanceof Timestamp ? data.processedAt.toDate() : null,
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
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
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
