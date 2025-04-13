import crypto from "crypto";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/types";
import { sendTransactionNotifications } from "@/services/notificationService";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { orderId, paymentId, signature, userId, amount } = req.body;

    // Verify signature
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Create transaction record
    const transactionRef = await addDoc(collection(db, "transactions"), {
      userId: userId,
      amount: amount,
      type: "deposit",
      status: "completed",
      description: "Payment via Razorpay",
      createdAt: new Date(),
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
    });

    // Send notifications
    await sendTransactionNotifications({
      id: transactionRef.id,
      userId,
      amount,
      type: "deposit",
      status: "completed",
      description: "Payment via Razorpay",
      createdAt: new Date(),
    });

    // Update user's wallet
    const walletRef = doc(db, "wallets", userId);
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      const wallet = walletDoc.data();
      await updateDoc(walletRef, {
        balance: wallet.balance + amount,
        totalInvested: wallet.totalInvested + amount,
      });
    }

    res.status(200).json({
      message: "Payment verified successfully",
      transactionId: transactionRef.id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
}
