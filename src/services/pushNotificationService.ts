/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — Web Push & PWA Registration Service (PMH-401 & PMH-402)
 * Invariante: Strict 21% TVA • Garanție de Rezervare (BT) • Netcup VPS
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { getAdminAuthHeaders } from '../utils/adminAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Înregistrează Service Worker-ul dedicat pentru Mail Hub (sw-mail.js)
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw-mail.js', {
        scope: '/'
      });
      this.swRegistration = reg;
      return reg;
    } catch (error) {
      console.warn('[PushService] Eroare la înregistrarea Service Worker:', error);
      return null;
    }
  }

  /**
   * Verifică dacă browserul suportă Web Push
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Obține starea curentă a permisiunilor
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Cere permisiune utilizatorului pentru notificări
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Înregistrează abonamentul Push pe serverul Netcup VPS
   */
  async subscribe(accountId?: string, dealerId: string = 'rxm'): Promise<boolean> {
    if (!this.isSupported()) return false;

    const perm = await this.requestPermission();
    if (perm !== 'granted') return false;

    try {
      const reg = this.swRegistration || (await this.registerServiceWorker());
      if (!reg) return false;

      // 1. Solicită cheia publică VAPID de la server
      const vapidRes = await fetch('/api/mail/push/vapid-key', {
        headers: getAdminAuthHeaders()
      });

      let vapidPublicKey = '';
      if (vapidRes.ok) {
        const vapidData = await vapidRes.json();
        vapidPublicKey = vapidData.publicKey;
      }

      // Fallback demo key dacă serverul rulează în dev mode fără VAPID generat
      if (!vapidPublicKey) {
        vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      // 2. Creare abonament în browser
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource
      });

      // 3. Trimitere abonament la server
      const subRes = await fetch('/api/mail/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          accountId: accountId || 'default-agent',
          dealerId,
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      return subRes.ok;
    } catch (err) {
      console.warn('[PushService] Eroare la abonare Web Push:', err);
      return false;
    }
  }

  /**
   * Declanșează o notificare locală de test
   */
  async triggerTestNotification(title: string, body: string, url: string = '/?tab=mail'): Promise<void> {
    if (!this.isSupported()) return;

    if (Notification.permission === 'granted') {
      const reg = this.swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/favicon-192x192.png',
          badge: '/favicon-48x48.png',
          data: { url },
          vibrate: [200, 100, 200]
        } as any);
      } else {
        new Notification(title, { body, icon: '/favicon-192x192.png' });
      }
    }
  }
}

export const pushNotificationService = new PushNotificationService();
