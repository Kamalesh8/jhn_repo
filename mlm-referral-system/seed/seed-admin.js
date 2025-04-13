import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB1nt2yoM-T5HfAq9EOc05ia5Imlx1t2U",
  authDomain: "mlm-referral-system.firebaseapp.com",
  projectId: "mlm-referral-system",
  storageBucket: "mlm-referral-system.firebasestorage.app",
  messagingSenderId: "813082304851",
  appId: "813082304851:web:fec16c1489dd2d5ff7c1a6",
  measurementId: "your_measurement_id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function generateReferralId(db) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let referralId = '';

  // Function to generate a random referral ID
  const generateId = () => {
    let id = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters.charAt(randomIndex);
    }
    return id;
  };

  // Check if the generated ID exists in the database
  let exists = true;
  while (exists) {
    referralId = generateId();
    const userRef = doc(db, "users", referralId);
    const userDoc = await getDoc(userRef);
    exists = userDoc.exists();
  }

  return referralId;
}

async function seedAdmin() {
  try {
    const email = "admin@example.com";
    const password = "admin123";
    const displayName = "System Admin";

    // First try to sign in
    try {
      console.log("Trying to sign in existing admin...");
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Admin user exists. Checking profile...");
      
      // Get the user's document
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Admin user profile found. Updating fields...");
        
        // Update any missing fields
        const updatedData = {
          id: auth.currentUser.uid,
          email: auth.currentUser.email,
          name: userData.name || displayName,
          referralId: userData.referralId || await generateReferralId(db),
          sponsorId: userData.sponsorId || "",
          walletId: userData.walletId || auth.currentUser.uid,
          downlineCount: userData.downlineCount || 0,
          isAdmin: true,
          createdAt: userData.createdAt || new Date(),
          updatedAt: new Date(),
          totalInvested: userData.totalInvested || 0,
          totalIncome: userData.totalIncome || 0,
          levelIncome: userData.levelIncome || 0,
          sponsorIncome: userData.sponsorIncome || 0,
          profitShare: userData.profitShare || 0,
          balance: userData.balance || 0
        };

        await setDoc(userRef, updatedData);
        console.log("Admin user profile updated successfully");
        console.log("Admin Referral ID:", updatedData.referralId);
        return;
      }
    } catch (error) {
      console.log("Admin user doesn't exist. Creating new admin...");
    }

    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update user profile
    await updateProfile(firebaseUser, {
      displayName: displayName
    });

    // Generate a unique referral ID
    const referralId = await generateReferralId(db);

    // Create user document in Firestore
    const userDoc = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName,
      referralId: referralId,
      sponsorId: "", // Admin doesn't have a sponsor
      walletId: firebaseUser.uid,
      downlineCount: 0, // Initialize downline count
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalInvested: 0,
      totalIncome: 0,
      levelIncome: 0,
      sponsorIncome: 0,
      profitShare: 0,
      balance: 0
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userDoc);

    console.log("Admin user created successfully");
    console.log("Admin Referral ID:", referralId);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

// Run the seeding function
seedAdmin();
