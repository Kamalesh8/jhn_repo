import Razorpay from "razorpay";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SystemSettings } from "@/types";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, userId } = req.body;

    // Get admin settings
    const settingsRef = doc(db, "settings", "system");
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      throw new Error("Admin settings not found");
    }

    const settings = settingsDoc.data() as SystemSettings;
    const { accountNumber } = settings.adminBankDetails;

    // Create order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId,
        accountNumber, // Add admin's account number for direct credit
      },
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order" });
  }
}
