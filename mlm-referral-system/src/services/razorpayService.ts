import axios from "axios";
import { loadScript } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SystemSettings, Transaction } from "@/types";
import { createTransaction } from "./firebaseService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  notes: {
    userId: string;
  };
  theme: {
    color: string;
  };
}

// Initialize Razorpay checkout
export async function initializeRazorpayCheckout(
  userId: string,
  userEmail: string,
  userName: string,
  amount: number,
  description: string,
  onSuccess: (transaction: Transaction) => void,
  onFailed: (error: unknown) => void
): Promise<void> {
  try {
    // Load Razorpay script
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    // Get admin settings for account details
    const settingsRef = doc(db, "settings", "system");
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      throw new Error("Admin settings not found");
    }

    const settings = settingsDoc.data() as SystemSettings;
    const { accountName } = settings.adminBankDetails;

    // Create order
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        userId,
        currency: "INR",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create order");
    }

    const order = await response.json();

    // Initialize Razorpay options
    const options: RazorpayOptions = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID!,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: accountName,
      description: description,
      order_id: order.id,
      handler: async function (response: RazorpayResponse) {
        try {
          // Verify payment
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: order.id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              userId,
              amount,
            }),
          });

          if (!verifyResponse.ok) {
            throw new Error("Payment verification failed");
          }

          const transaction = await createTransaction({
            userId,
            amount,
            type: "deposit",
            status: "completed",
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            description,
          });

          onSuccess(transaction);
        } catch (error) {
          console.error("Payment verification failed:", error);
          onFailed(error);
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
      },
      notes: {
        userId,
      },
      theme: {
        color: "#0F172A",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error("Razorpay initialization failed:", error);
    onFailed(error);
  }
}
