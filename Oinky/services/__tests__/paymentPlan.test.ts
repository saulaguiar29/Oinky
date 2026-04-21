import { getPaymentPlan, formatShortDate } from "../paymentPlan";

// Helper to build a future date string N days from now
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ─── getPaymentPlan ───────────────────────────────────────────────────────────
describe("getPaymentPlan", () => {
  it("returns null when the goal is already complete", () => {
    const plan = getPaymentPlan({
      targetAmount: 500,
      currentAmount: 500,
      savingPlan: "monthly",
      deadline: daysFromNow(30),
    });
    expect(plan).toBeNull();
  });

  it("returns null when there is no deadline", () => {
    const plan = getPaymentPlan({
      targetAmount: 500,
      currentAmount: 100,
      savingPlan: "monthly",
      deadline: null,
    });
    expect(plan).toBeNull();
  });

  it("returns null when the deadline has already passed", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const plan = getPaymentPlan({
      targetAmount: 500,
      currentAmount: 100,
      savingPlan: "monthly",
      deadline: pastDate.toISOString(),
    });
    expect(plan).toBeNull();
  });

  it("calculates a daily plan correctly", () => {
    const plan = getPaymentPlan({
      targetAmount: 100,
      currentAmount: 0,
      savingPlan: "daily",
      deadline: daysFromNow(10),
    });

    expect(plan).not.toBeNull();
    expect(plan!.periodLabel).toBe("day");
    expect(plan!.periodsLeft).toBe(10);
    // $100 / 10 days = $10/day
    expect(plan!.amountPerPeriod).toBe(10);
  });

  it("calculates a biweekly plan correctly", () => {
    const plan = getPaymentPlan({
      targetAmount: 280,
      currentAmount: 0,
      savingPlan: "biweekly",
      deadline: daysFromNow(28), // exactly 2 biweekly periods
    });

    expect(plan).not.toBeNull();
    expect(plan!.periodLabel).toBe("2 wks");
    expect(plan!.periodsLeft).toBe(2);
    expect(plan!.amountPerPeriod).toBe(140); // 280 / 2
  });

  it("calculates a monthly plan correctly", () => {
    const plan = getPaymentPlan({
      targetAmount: 600,
      currentAmount: 0,
      savingPlan: "monthly",
      deadline: daysFromNow(90), // ~3 months
    });

    expect(plan).not.toBeNull();
    expect(plan!.periodLabel).toBe("mo");
    expect(plan!.periodsLeft).toBe(3);
    expect(plan!.amountPerPeriod).toBe(200); // 600 / 3
  });

  it("rounds up to the nearest cent", () => {
    // $100 over 3 days = $33.34 (rounded up from 33.333...)
    const plan = getPaymentPlan({
      targetAmount: 100,
      currentAmount: 0,
      savingPlan: "daily",
      deadline: daysFromNow(3),
    });

    expect(plan).not.toBeNull();
    expect(plan!.amountPerPeriod).toBe(33.34);
  });

  it("accounts for money already saved", () => {
    // $200 remaining out of $500 target, 10 days
    const plan = getPaymentPlan({
      targetAmount: 500,
      currentAmount: 300,
      savingPlan: "daily",
      deadline: daysFromNow(10),
    });

    expect(plan).not.toBeNull();
    expect(plan!.amountPerPeriod).toBe(20); // 200 / 10
  });

  it("uses at least 1 period even with a very close deadline", () => {
    const plan = getPaymentPlan({
      targetAmount: 100,
      currentAmount: 0,
      savingPlan: "monthly",
      deadline: daysFromNow(1), // less than one month away
    });

    expect(plan).not.toBeNull();
    expect(plan!.periodsLeft).toBe(1);
    expect(plan!.amountPerPeriod).toBe(100); // all at once
  });
});

// ─── formatShortDate ──────────────────────────────────────────────────────────
describe("formatShortDate", () => {
  it("formats a date in the current year without the year", () => {
    const date = new Date();
    date.setMonth(0); // January
    date.setDate(15);
    const result = formatShortDate(date);
    expect(result).toBe("Jan 15");
  });

  it("includes the year for dates in a different year", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    futureDate.setMonth(5); // June
    futureDate.setDate(10);
    const result = formatShortDate(futureDate);
    expect(result).toContain(String(futureDate.getFullYear()));
    expect(result).toContain("Jun");
  });
});
