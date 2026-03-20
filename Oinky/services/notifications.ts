import * as Notifications from "expo-notifications";

// How the notification appears when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Request permission ────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ── Schedule a saving reminder for a goal ─────────────────────────────────────
export async function scheduleGoalReminder(goal: {
  _id: string;
  title: string;
  savingPlan: string;
}) {
  // Cancel any existing reminder for this goal first
  await cancelGoalReminder(goal._id);

  const granted = await requestNotificationPermission();
  if (!granted) return;

  let trigger: Notifications.NotificationTriggerInput;

  if (goal.savingPlan === "daily") {
    // Every day at 9am
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    };
  } else if (goal.savingPlan === "biweekly") {
    // Every 14 days from now at 9am
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 14,
      repeats: true,
    };
  } else {
    // Monthly — every 30 days at 9am
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24 * 30,
      repeats: true,
    };
  }

  await Notifications.scheduleNotificationAsync({
    identifier: `goal-reminder-${goal._id}`,
    content: {
      title: " Time to save!",
      body: `Don't forget to add to your "${goal.title}" goal.`,
      data: { goalId: goal._id },
    },
    trigger,
  });
}

// ── Schedule a missed payment nudge────────
export async function scheduleMissedPaymentNudge(goal: {
  _id: string;
  title: string;
  savingPlan: string;
}) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const secondsPerPlan: Record<string, number> = {
    daily: 60 * 60 * 24 * 2, // 2 days
    biweekly: 60 * 60 * 24 * 16, // 2 days late
    monthly: 60 * 60 * 24 * 35, // 5 days late
  };

  const seconds = secondsPerPlan[goal.savingPlan] ?? 60 * 60 * 24 * 3;

  await Notifications.scheduleNotificationAsync({
    identifier: `goal-nudge-${goal._id}`,
    content: {
      title: "🐷 Don't fall behind!",
      body: `You haven't saved toward "${goal.title}" in a while. Keep it up!`,
      data: { goalId: goal._id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

// ── Cancel reminders for a goal (call on delete or completion) ────────────────
export async function cancelGoalReminder(goalId: string) {
  await Notifications.cancelScheduledNotificationAsync(
    `goal-reminder-${goalId}`,
  );
  await Notifications.cancelScheduledNotificationAsync(`goal-nudge-${goalId}`);
}
