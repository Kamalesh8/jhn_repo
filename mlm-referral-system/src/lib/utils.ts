import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { doc, getDoc } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReferralId(length: number = 16): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function generateReferralIdFromDb(db: any): Promise<string> {
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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date instanceof Date ? date : new Date(date));
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export function calculateLevelCommission(
  amount: number,
  level: number,
  commissionRates: { level: number; percentage: number }[]
): number {
  const commission = commissionRates.find(rate => rate.level === level);
  if (!commission) return 0;

  return (amount * commission.percentage) / 100;
}

export function calculateSponsorCommission(
  amount: number,
  sponsorCommissionPercentage: number
): number {
  return (amount * sponsorCommissionPercentage) / 100;
}

export function calculateProfitShare(
  amount: number,
  profitSharePercentage: number
): number {
  return (amount * profitSharePercentage) / 100;
}

// Generate random transaction ID for Razorpay
export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is admin email
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
}

// Validate phone number (simple 10-digit validation)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

// Load script utility function
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

// Load Razorpay script
export async function loadRazorpay(): Promise<typeof window.Razorpay> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      // @ts-ignore: Razorpay exists on window after script loads
      resolve(window.Razorpay);
    };
    document.body.appendChild(script);
  });
}
