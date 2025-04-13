import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
      console.log("User profile found:");
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

// Get the current user from auth
try {
  const user = auth.currentUser;
  if (user) {
    console.log("Checking user profile for:", user.email);
    checkUserProfile(user.uid);
  } else {
    console.log("No user is currently logged in");
  }
} catch (error) {
  console.error("Error getting current user:", error);
}
