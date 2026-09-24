// src/lib/notifications.js
// Helper for sending notifications using Service Worker (best for PWA) or fallback standard Notification API.

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
}

export async function sendNotification(title, options = {}) {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions = {
    icon: '/logo.jpg',
    badge: '/logo.jpg', // For Android
    ...options,
  };

  try {
    // 1. Try Service Worker first (most reliable for PWAs/background)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }
  } catch (err) {
    console.warn('Service Worker notification failed, falling back to standard API', err);
  }

  // 2. Fallback to standard Notification API
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.error('Standard notification failed:', err);
    return false;
  }
}
