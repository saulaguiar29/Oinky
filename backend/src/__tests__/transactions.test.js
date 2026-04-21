const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");

// Mock Firebase admin
jest.mock("firebase-admin", () => ({
  storage: () => ({ bucket: () => ({}) }),
}));

// Mock auth middleware — inject a fake user
jest.mock("../middleware/auth", () => (req, res, next) => {
  req.user = { _id: "user123", email: "test@example.com" };
  next();
});

// Mock models
jest.mock("../models/SavingsGoal");
jest.mock("../models/Transaction");

// Mock mongoose sessions (transactions use startSession)
jest.spyOn(mongoose, "startSession").mockResolvedValue({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
});

const SavingsGoal = require("../models/SavingsGoal");
const Transaction = require("../models/Transaction");
const transactionsRouter = require("../routes/transactions");

const app = express();
app.use(express.json());
app.use("/api/transactions", transactionsRouter);

// ─── POST /api/transactions/deposit ──────────────────────────────────────────
describe("POST /api/transactions/deposit", () => {
  it("returns 400 if goalId is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/deposit")
      .send({ amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 if amount is zero or negative", async () => {
    const res = await request(app)
      .post("/api/transactions/deposit")
      .send({ goalId: "goal123", amount: -10 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 if the goal does not exist", async () => {
    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post("/api/transactions/deposit")
      .send({ goalId: "nonexistent", amount: 50 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("deposits successfully and returns the new amount", async () => {
    const fakeGoal = {
      _id: "goal123",
      currentAmount: 100,
      targetAmount: 500,
      status: "active",
    };

    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeGoal),
    });

    const fakeTransaction = { _id: "tx1", type: "deposit", amount: 50 };
    Transaction.create.mockResolvedValue([fakeTransaction]);
    SavingsGoal.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post("/api/transactions/deposit")
      .send({ goalId: "goal123", amount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.newAmount).toBe(150);
    expect(res.body.goalCompleted).toBe(false);
  });

  it("marks goal as completed when deposit hits the target", async () => {
    const fakeGoal = {
      _id: "goal123",
      currentAmount: 450,
      targetAmount: 500,
      status: "active",
    };

    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeGoal),
    });

    Transaction.create.mockResolvedValue([{ _id: "tx2", type: "deposit", amount: 50 }]);
    SavingsGoal.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post("/api/transactions/deposit")
      .send({ goalId: "goal123", amount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.goalCompleted).toBe(true);
    expect(res.body.newAmount).toBe(500);
  });
});

// ─── POST /api/transactions/withdraw ─────────────────────────────────────────
describe("POST /api/transactions/withdraw", () => {
  it("returns 400 if amount is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/withdraw")
      .send({ goalId: "goal123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 if withdrawal exceeds the current balance", async () => {
    const fakeGoal = {
      _id: "goal123",
      currentAmount: 100,
      targetAmount: 500,
    };

    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeGoal),
    });

    const res = await request(app)
      .post("/api/transactions/withdraw")
      .send({ goalId: "goal123", amount: 200 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot withdraw/i);
  });

  it("withdraws successfully and returns the new amount", async () => {
    const fakeGoal = {
      _id: "goal123",
      currentAmount: 300,
      targetAmount: 500,
    };

    SavingsGoal.findOne.mockReturnValue({
      session: jest.fn().mockResolvedValue(fakeGoal),
    });

    Transaction.create.mockResolvedValue([{ _id: "tx3", type: "withdrawal", amount: 100 }]);
    SavingsGoal.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post("/api/transactions/withdraw")
      .send({ goalId: "goal123", amount: 100 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.newAmount).toBe(200);
  });
});

// ─── POST /api/transactions/transfer ─────────────────────────────────────────
describe("POST /api/transactions/transfer", () => {
  it("returns 400 if transferring to the same goal", async () => {
    const res = await request(app)
      .post("/api/transactions/transfer")
      .send({ fromGoalId: "goal123", toGoalId: "goal123", amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/same goal/i);
  });

  it("returns 400 if amount is missing", async () => {
    const res = await request(app)
      .post("/api/transactions/transfer")
      .send({ fromGoalId: "goal1", toGoalId: "goal2" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
