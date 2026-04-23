import { randomUUID } from "node:crypto";

import type { NotificationRow } from "./schema";

type NotificationSubscriber = (notification: NotificationRow) => void;

const subscribersByUserId = new Map<string, Map<string, NotificationSubscriber>>();

export function subscribeToUserNotifications(
  userId: string,
  subscriber: NotificationSubscriber
): () => void {
  const subscriptionId = randomUUID();
  const subscribers = subscribersByUserId.get(userId) ?? new Map<string, NotificationSubscriber>();
  subscribers.set(subscriptionId, subscriber);
  subscribersByUserId.set(userId, subscribers);

  return () => {
    const current = subscribersByUserId.get(userId);
    if (!current) return;
    current.delete(subscriptionId);
    if (current.size === 0) subscribersByUserId.delete(userId);
  };
}

export function publishNotification(notification: NotificationRow): void {
  const subscribers = subscribersByUserId.get(notification.user_id);
  if (!subscribers || subscribers.size === 0) return;

  for (const subscriber of subscribers.values()) {
    try {
      subscriber(notification);
    } catch {
      // Ignore broken listeners; HTTP layer handles connection cleanup.
    }
  }
}

export function getNotificationSubscriberCount(userId?: string): number {
  if (userId) return subscribersByUserId.get(userId)?.size ?? 0;

  let total = 0;
  for (const subscribers of subscribersByUserId.values()) total += subscribers.size;
  return total;
}
