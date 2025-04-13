import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { generateReferralId } from "./utils";

export async function seedDatabase() {
  // Check if database is already seeded
  const seedCheckRef = doc(db, "system", "seed");
  const seedCheckDoc = await getDoc(seedCheckRef);
  
  if (seedCheckDoc.exists()) {
    console.log("Database is already seeded");
    return;
  }

  // Create admin account
  const adminRef = doc(db, "users", "admin");
  await setDoc(adminRef, {
    id: "admin",
    email: "admin@example.com",
    name: "Admin User",
    referralId: generateReferralId(),
    sponsorId: "admin",
    isAdmin: true,
    createdAt: new Date(),
  });

  // Create initial user account
  const userRef = doc(db, "users", "user1");
  await setDoc(userRef, {
    id: "user1",
    email: "user1@example.com",
    name: "Initial User",
    referralId: generateReferralId(),
    sponsorId: "admin",
    isAdmin: false,
    createdAt: new Date(),
  });

  // Create system settings
  const settingsRef = doc(db, "settings", "main");
  await setDoc(settingsRef, {
    id: "main",
    sponsorCommissionPercentage: 10,
    profitSharePercentage: 5,
    levelCommissions: [
      { level: 1, percentage: 5 },
      { level: 2, percentage: 3 },
      { level: 3, percentage: 2 }
    ],
    minDepositAmount: 1000,
    minWithdrawalAmount: 500,
    lastUpdated: new Date(),
  });

  // Mark database as seeded
  await setDoc(seedCheckRef, { seeded: true, timestamp: new Date() });

  console.log("Database seeding completed successfully!");
}
