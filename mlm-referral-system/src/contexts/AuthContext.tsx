import { createContext, useContext, useEffect, useState } from "react";
import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase.ts";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment,
  onSnapshot
} from "firebase/firestore";
import type { User } from "@/types";
import { generateReferralId, isAdminEmail } from "@/lib/utils";
import { toast } from "sonner";
import { getUserByReferralId, createReferral, updateTeamSize } from "@/services/firebaseService";

type AuthContextType = {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  setUserProfile: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  register: (name: string, email: string, password: string, sponsorId: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<string>;
  loading: boolean;
  isAdmin: boolean;
  fetchUserProfile: (userId: string) => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchUserProfile(userId: string) {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
        setIsAdmin(userData.isAdmin || false);
        return userData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setCurrentUser(user);

        if (user) {
          // Add real-time listener for user profile updates
          const profileRef = doc(db, "users", user.uid);
          const profileUnsubscribe = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
              const userData = doc.data() as User;
              setUserProfile(userData);
              setIsAdmin(userData.isAdmin || false);
            }
          });

          // Initial fetch
          const profile = await fetchUserProfile(user.uid);
          if (!profile) {
            setIsAdmin(isAdminEmail(user.email || ""));
          }

          return () => profileUnsubscribe();
        } else {
          setUserProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // First set initial admin status based on email
        setIsAdmin(isAdminEmail(result.user.email || ""));
        
        const userRef = doc(db, "users", result.user.uid);
        
        // Update last login time
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          lastActivity: serverTimestamp()
        });

        // Fetch and set user profile
        const profile = await fetchUserProfile(result.user.uid);
        if (!profile) {
          console.log("No profile found for user, using email-based admin check");
        }
      }

      return result.user;
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.code === "auth/invalid-credential") {
        throw new Error("Invalid email or password");
      }
      
      throw error;
    }
  }

  // Function to update the entire referral chain
  const updateReferralChain = async (userId: string) => {
    try {
      setLoading(true);
      // Get the user's profile to find their sponsor
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data() as User;
      let currentSponsorId = userData.sponsorId;

      // Update team sizes up the chain
      while (currentSponsorId) {
        await updateTeamSize(currentSponsorId);
        const sponsorDoc = await getDoc(doc(db, "users", currentSponsorId));
        if (!sponsorDoc.exists()) break;
        const sponsorData = sponsorDoc.data() as User;
        currentSponsorId = sponsorData.sponsorId;
      }
    } catch (error) {
      console.error("Error updating referral chain:", error);
    } finally {
      setLoading(false);
    }
  };

  async function register(name: string, email: string, password: string, sponsorId: string): Promise<User> {
    try {
      setLoading(true);

      // Create the user account
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Get the sponsor's data
      const sponsor = await getUserByReferralId(sponsorId);
      if (!sponsor) {
        throw new Error("Invalid sponsor referral ID");
      }

      // Generate a unique referral ID for the new user
      const referralId = generateReferralId(16); // Pass length parameter

      // Create the user profile
      const userProfile: User = {
        id: firebaseUser.uid,
        name,
        email,
        phone: "",
        referralId,
        sponsorId: sponsor.id,
        sponsorReferralId: sponsorId,
        isAdmin: false,
        totalTeamSize: 0,
        directReferrals: 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        status: "active",
        lastActivity: serverTimestamp() as any,
      };

      // Create user document
      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);

      // Create the referral relationship
      await createReferral(firebaseUser.uid, sponsor.id);

      // Update the entire referral chain
      await updateReferralChain(firebaseUser.uid);

      // Set up real-time listener for the user's profile
      const profileRef = doc(db, "users", firebaseUser.uid);
      onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as User);
        }
      });

      return userProfile;

    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already registered");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          lastActivity: serverTimestamp()
        });
      }
      await signOut(auth);
      setUserProfile(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      }
      throw error;
    }
  }

  async function updateProfilePicture(file: File) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // Create a temporary URL for immediate display
      const tempURL = URL.createObjectURL(file);

      // Update profile with temp URL first
      await updateProfile(currentUser, {
        photoURL: tempURL,
      });

      // Update user document with temp URL
      await updateDoc(doc(db, "users", currentUser.uid), {
        photoURL: tempURL,
        updatedAt: serverTimestamp()
      });

      // Now handle the actual upload in the background
      const uploadAndUpdate = async () => {
        try {
          const timestamp = Date.now();
          const storageRef = ref(storage, `profile-pictures/${currentUser.uid}_${timestamp}.${file.name.split('.').pop()}`);

          // Upload file
          const uploadResult = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(uploadResult.ref);

          // Update profile with permanent URL
          await updateProfile(currentUser, {
            photoURL: downloadURL,
          });

          // Update user document with permanent URL
          await updateDoc(doc(db, "users", currentUser.uid), {
            photoURL: downloadURL,
            updatedAt: serverTimestamp()
          });

          // Clean up temporary URL
          URL.revokeObjectURL(tempURL);

          return downloadURL;
        } catch (uploadError) {
          console.error("Background upload failed:", uploadError);
          // Keep the temp URL if upload fails
          return tempURL;
        }
      };

      // Start the background upload
      uploadAndUpdate().catch(console.error);

      return tempURL;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error("Failed to update profile picture. Please try again.");
    }
  }

  async function updateUserProfile(data: Partial<User>) {
    try {
      if (!currentUser) throw new Error("No authenticated user");

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      const updatedProfile = await fetchUserProfile(currentUser.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async function updateTeamSize(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      // Get direct referrals (level 1)
      const referralsRef = collection(db, "referrals");
      const directReferralsQuery = query(referralsRef, where("sponsorId", "==", userId));
      const directReferralsSnapshot = await getDocs(directReferralsQuery);
      const directReferralsCount = directReferralsSnapshot.size;

      // Calculate total team size recursively
      const processedUsers = new Set<string>();
      const calculateTotalTeamSize = async (currentUserId: string): Promise<number> => {
        if (processedUsers.has(currentUserId)) return 0;
        processedUsers.add(currentUserId);

        const referralsQuery = query(referralsRef, where("sponsorId", "==", currentUserId));
        const referralsSnapshot = await getDocs(referralsQuery);
        let totalSize = referralsSnapshot.size;

        for (const referralDoc of referralsSnapshot.docs) {
          const referralData = referralDoc.data();
          totalSize += await calculateTotalTeamSize(referralData.userId);
        }

        return totalSize;
      };

      const totalTeamSize = await calculateTotalTeamSize(userId);

      // Update user's metrics in database
      await updateDoc(userRef, {
        directReferrals: directReferralsCount,
        totalTeamSize,
        updatedAt: serverTimestamp()
      });

      // Update local state if this is the current user
      if (currentUser?.uid === userId) {
        const updatedProfile = await fetchUserProfile(userId);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
        }
      }

      // Update sponsor's team size if they exist
      const userData = userDoc.data() as User;
      if (userData.sponsorId && !processedUsers.has(userData.sponsorId)) {
        await updateTeamSize(userData.sponsorId);
      }

    } catch (error) {
      console.error("Error updating team size:", error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    updateProfilePicture,
    loading,
    isAdmin,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
