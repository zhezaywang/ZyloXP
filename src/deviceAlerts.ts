export const DEVICE_ALERTS_STORAGE_KEY = 'zyloxp-device-alerts-v1';

export type DeviceAlertPermission = NotificationPermission | 'unsupported';

type DeviceAlertOptions = {
  body: string;
  route: string;
  tag: string;
  title: string;
};

export function readDeviceAlertPermission(): DeviceAlertPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return window.Notification.permission;
}

export function readDeviceAlertsEnabled() {
  if (
    typeof window === 'undefined' ||
    readDeviceAlertPermission() !== 'granted'
  ) {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(DEVICE_ALERTS_STORAGE_KEY) === 'enabled'
    );
  } catch {
    return false;
  }
}

export async function sendDeviceAlert({
  body,
  route,
  tag,
  title,
}: DeviceAlertOptions) {
  if (readDeviceAlertPermission() !== 'granted') {
    return;
  }

  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
  const appRoute = route.startsWith('/#') ? route.slice(1) : route;
  const targetUrl = new URL(appRoute, appBaseUrl).href;
  const options: NotificationOptions = {
    body,
    data: { url: targetUrl },
    icon: new URL('zylo-app-icon-192.png', appBaseUrl).href,
    tag,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }

    const notification = new window.Notification(title, options);
    notification.onclick = () => {
      notification.close();
      window.focus();
      window.location.href = targetUrl;
    };
  } catch {
    // Alerts are optional; timer and in-app feedback remain available.
  }
}
