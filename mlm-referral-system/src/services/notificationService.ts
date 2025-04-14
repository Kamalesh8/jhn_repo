import type { Notification } from '@/types';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Function to create in-app notification
export async function createInAppNotification({
  userId,
  title,
  message,
  type = 'info',
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}) {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    const notification: Notification = {
      id: notificationRef.id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
      link,
    };

    await setDoc(notificationRef, notification);

    // Update user's unread notifications count
    await updateDoc(doc(db, 'users', userId), {
      unreadNotifications: increment(1),
      notifications: arrayUnion(notification),
    });

    return notification;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    throw error;
  }
}

// Function to mark notification as read
export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });

    // Update user's unread notifications count
    await updateDoc(doc(db, 'users', userId), {
      unreadNotifications: increment(-1),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Function to get user notifications
export async function getUserNotifications(userId: string) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Notification[];
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
}
