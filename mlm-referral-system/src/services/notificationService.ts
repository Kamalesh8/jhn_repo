import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Transaction } from '@/types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.VITE_EMAIL_USER,
    pass: process.env.VITE_EMAIL_PASSWORD,
  },
});

// Twilio configuration
const twilioClient = twilio(
  process.env.VITE_TWILIO_ACCOUNT_SID,
  process.env.VITE_TWILIO_AUTH_TOKEN
);

interface NotificationRecipient {
  email: string;
  phone: string;
  name: string;
}

// Function to get user details for notification
async function getUserDetails(userId: string): Promise<NotificationRecipient | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        email: userData.email,
        phone: userData.phone,
        name: userData.name,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}

// Function to get admin details
async function getAdminDetails(): Promise<NotificationRecipient[]> {
  try {
    const usersRef = doc(db, "users", "admin"); // Assuming there's an admin document
    const adminDoc = await getDoc(usersRef);
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return [{
        email: adminData.email,
        phone: adminData.phone,
        name: adminData.name,
      }];
    }
    return [];
  } catch (error) {
    console.error("Error fetching admin details:", error);
    return [];
  }
}

// Function to send email notification
async function sendEmailNotification(
  recipient: NotificationRecipient,
  transaction: Transaction,
  isAdmin: boolean
) {
  const subject = isAdmin
    ? `New Transaction Alert - ${transaction.type.toUpperCase()}`
    : `Transaction ${transaction.status.toUpperCase()} - ${transaction.type.toUpperCase()}`;

  const message = isAdmin
    ? `
      New transaction detected:\n
      Type: ${transaction.type}\n
      Amount: ${transaction.amount}\n
      Status: ${transaction.status}\n
      User: ${recipient.name}\n
      Transaction ID: ${transaction.id}
    `
    : `
      Dear ${recipient.name},\n\n
      Your transaction has been ${transaction.status}:\n
      Type: ${transaction.type}\n
      Amount: ${transaction.amount}\n
      Status: ${transaction.status}\n
      Transaction ID: ${transaction.id}\n\n
      If you did not initiate this transaction, please contact support immediately.
    `;

  try {
    await emailTransporter.sendMail({
      from: process.env.VITE_EMAIL_USER,
      to: recipient.email,
      subject,
      text: message,
    });
    console.log(`Email notification sent to ${recipient.email}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

// Function to send SMS notification
async function sendSMSNotification(
  recipient: NotificationRecipient,
  transaction: Transaction,
  isAdmin: boolean
) {
  const message = isAdmin
    ? `MLM Alert: New ${transaction.type} transaction of ${transaction.amount} by ${recipient.name}. Status: ${transaction.status}`
    : `MLM: Your ${transaction.type} transaction of ${transaction.amount} is ${transaction.status}. ID: ${transaction.id}`;

  try {
    if (recipient.phone) {
      await twilioClient.messages.create({
        body: message,
        to: recipient.phone,
        from: process.env.VITE_TWILIO_PHONE_NUMBER,
      });
      console.log(`SMS notification sent to ${recipient.phone}`);
    }
  } catch (error) {
    console.error("Error sending SMS notification:", error);
  }
}

// Main function to handle transaction notifications
export async function sendTransactionNotifications(transaction: Transaction) {
  try {
    // Get user details
    const userDetails = await getUserDetails(transaction.userId);
    if (userDetails) {
      // Send notifications to user
      await Promise.all([
        sendEmailNotification(userDetails, transaction, false),
        sendSMSNotification(userDetails, transaction, false),
      ]);
    }

    // Get admin details and send notifications
    const adminRecipients = await getAdminDetails();
    for (const admin of adminRecipients) {
      await Promise.all([
        sendEmailNotification(admin, transaction, true),
        sendSMSNotification(admin, transaction, true),
      ]);
    }
  } catch (error) {
    console.error("Error sending transaction notifications:", error);
  }
}
