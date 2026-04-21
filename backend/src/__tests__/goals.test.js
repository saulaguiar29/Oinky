const request = require("supertest");
const express = require("express");

// Mock Firebase admin so it doesn't try to initialize during tests
jest.mock("firebase-admin", () => ({
  storage: () => ({ bucket: () => ({}) }),
}));

// Mock the auth middleware — injects a fake logged-in user instead of checking Firebase
jest.mock("../middleware/auth", () => (req, res, next) => {
  req.user = { _id: "user123", email: "test@example.com" };
  next();
});

// Mock the database models so we don't need a real MongoDB connection
jest.mock("../models/SavingsGoal");
jest.mock("../models/Transaction");

const SavingsGoal = require("../models/SavingsGoal");
const goalsRouter = require("../routes/goals");

// Build a minimal Express app with just the goals router
const app = express();
app.use(express.json());
app.use("/api/goals", goalsRouter);

// ─── POST /api/goals ──────────────────────────────────────────────────────────
describe("POST /api/goals — create a goal", () => {
  it("returns 400 if title is missing", async () => {
    const res = await request(app)
      .post("/api/goals")
      .send({ targetAmount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 400 if targetAmount is missing", async () => {
    const res = await request(app)
      .post("/api/goals")
      .send({ title: "New iPhone" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates a goal and returns 201 when all fields are valid", async () => {
    const fakeGoal = {
      _id: "goal123",
      title: "New iPhone",
      targetAmount: 1000,
      currentAmount: 0,
      status: "active",
      savingPlan: "monthly",
    };

    SavingsGoal.create.mockResolvedValue(fakeGoal);

    const res = await request(app).post("/api/goals").send({
      title: "New iPhone",
      targetAmount: 1000,
      savingPlan: "monthly",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.goal.title).toBe("New iPhone");
  });
});

// ─── GET /api/goals ───────────────────────────────────────────────────────────
describe("GET /api/goals — list goals", () => {
  it("returns goals and totalSaved", async () => {
    const fakeGoals = [
      { _id: "g1", title: "Laptop", currentAmount: 300, targetAmount: 1000, status: "active" },
      { _id: "g2", title: "Vacation", currentAmount: 500, targetAmount: 2000, status: "active" },
    ];

    SavingsGoal.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(fakeGoals),
    });

    const res = await request(app).get("/api/goals");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.goals).toHaveLength(2);
    expect(res.body.totalSaved).toBe(800); // 300 + 500
  });
});

// ─── GET /api/goals/:id ───────────────────────────────────────────────────────
describe("GET /api/goals/:id — single goal", () => {
  it("returns 404 if goal does not exist", async () => {
    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    // findOne returns null directly in this route (no .session())
    SavingsGoal.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/goals/nonexistent123");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─── POST /api/goals/summary/savings-plan ────────────────────────────────────
describe("POST /api/goals/summary/savings-plan — savings calculator", () => {
  it("returns 400 if fields are missing", async () => {
    const res = await request(app)
      .post("/api/goals/summary/savings-plan")
      .send({ targetAmount: 1000 }); // missing deadline and savingPlan

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 if deadline is in the past", async () => {
    const res = await request(app)
      .post("/api/goals/summary/savings-plan")
      .send({
        targetAmount: 1000,
        deadline: "2020-01-01",
        savingPlan: "monthly",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/future/i);
  });

  it("returns a savings summary for a valid request", async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);

    const res = await request(app)
      .post("/api/goals/summary/savings-plan")
      .send({
        targetAmount: 1200,
        currentAmount: 0,
        deadline: futureDate.toISOString(),
        savingPlan: "monthly",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.remaining).toBe(1200);
    expect(res.body.summary.periodsLeft).toBeGreaterThan(0);
    expect(res.body.summary.amountPerPeriod).toBeGreaterThan(0);
  });
});
