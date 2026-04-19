const MS_DAY = 1000 * 60 * 60 * 24;

export type PaymentPlan = {
  amountPerPeriod: number; // amount to save each period
  periodLabel: string;     // "day" | "2 wks" | "mo"
  periodsLeft: number;     // how many periods until deadline
  nextDueDate: Date;       // when to make the next payment
  deadlineDate: Date;      // the goal deadline
};

/**
 * Returns a payment plan based on remaining amount, saving plan, and deadline.
 * Returns null if the goal is complete, overdue, or has no deadline.
 */
export function getPaymentPlan(goal: {
  targetAmount: number;
  currentAmount: number;
  savingPlan: string;
  deadline?: string | null;
}): PaymentPlan | null {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0 || !goal.deadline) return null;

  const now = new Date();
  const deadlineDate = new Date(goal.deadline);
  const msLeft = deadlineDate.getTime() - now.getTime();
  if (msLeft <= 0) return null; // deadline passed

  const daysLeft = msLeft / MS_DAY;

  let periodsLeft: number;
  let periodLabel: string;
  let nextDueDate: Date;

  switch (goal.savingPlan) {
    case "daily":
      periodsLeft = Math.max(1, Math.ceil(daysLeft));
      periodLabel = "day";
      nextDueDate = new Date(now.getTime() + MS_DAY);
      break;
    case "biweekly":
      periodsLeft = Math.max(1, Math.ceil(daysLeft / 14));
      periodLabel = "2 wks";
      nextDueDate = new Date(now.getTime() + 14 * MS_DAY);
      break;
    default: // monthly
      periodsLeft = Math.max(1, Math.ceil(daysLeft / 30));
      periodLabel = "mo";
      // next 1st of the month
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
  }

  // Round up to nearest cent so the plan is always achievable
  const amountPerPeriod = Math.ceil((remaining / periodsLeft) * 100) / 100;

  return { amountPerPeriod, periodLabel, periodsLeft, nextDueDate, deadlineDate };
}

/** Formats a date as "Jan 15" or "Jan 15, 2027" (year only if not current year) */
export function formatShortDate(date: Date): string {
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    date.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", opts);
}
