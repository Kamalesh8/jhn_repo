import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkUserProfile(userId) {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("\nUser profile found:");
      console.log("ID:", userData.id);
      console.log("Email:", userData.email);
      console.log("Name:", userData.name);
      console.log("Referral ID:", userData.referralId);
      console.log("Sponsor ID:", userData.sponsorId);
      console.log("Is Admin:", userData.isAdmin);
      console.log("Created At:", userData.createdAt);
      console.log("Updated At:", userData.updatedAt);
    } else {
      console.log("No user profile found");
    }
  } catch (error) {
    console.error("Error checking user profile:", error);
  }
}

async function loginAndCheck() {
  try {
    // Login with admin credentials
    const email = "admin@example.com";
    const password = "admin123";
    
    console.log("Logging in with admin credentials...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      throw new Error("Failed to get user after login");
    }

    console.log("Successfully logged in. Checking user profile...");
    await checkUserProfile(user.uid);
  } catch (error) {
    console.error("Error:", error);
    if (error.code === "auth/wrong-password") {
      console.error("Invalid password. Please check your credentials.");
    } else if (error.code === "auth/user-not-found") {
      console.error("User not found. Please check your email.");
    }
  }
}

loginAndCheck();
