const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');

/**
 * GET /api/transactions
 * Get all transactions for the logged-in user (Karla's feedback: transaction log)
 * Optional ?goalId= filter
 */
router.get('/', protect, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.goalId) filter.goalId = req.query.goalId;

    const transactions = await Transaction.find(filter)
      .populate('goalId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/transactions/deposit
 * Add money to a savings goal
 * Updates goal's currentAmount and auto-completes the goal if target is hit
 */
router.post('/deposit', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { goalId, amount, source = 'Manual', note } = req.body;

    if (!goalId || !amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'goalId and a positive amount are required' });
    }

    const goal = await SavingsGoal.findOne({
      _id: goalId,
      userId: req.user._id,
      status: 'active',
    }).session(session);

    if (!goal) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Active goal not found' });
    }

    // Create transaction
    const [transaction] = await Transaction.create(
      [{ userId: req.user._id, goalId, type: 'deposit', source, amount, note }],
      { session }
    );

    // Update goal's currentAmount
    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;

    await SavingsGoal.findByIdAndUpdate(
      goalId,
      {
        currentAmount: newAmount,
        ...(isCompleted && { status: 'completed' }),
      },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      transaction,
      goalCompleted: isCompleted,
      newAmount: parseFloat(newAmount.toFixed(2)),
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

/**
 * POST /api/transactions/withdraw
 * Withdraw money from a goal (Martin's feedback: change mind about buying)
 */
router.post('/withdraw', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { goalId, amount, note } = req.body;

    if (!goalId || !amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'goalId and a positive amount are required' });
    }

    const goal = await SavingsGoal.findOne({
      _id: goalId,
      userId: req.user._id,
    }).session(session);

    if (!goal) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (amount > goal.currentAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw $${amount}. Current balance is $${goal.currentAmount}`,
      });
    }

    const [transaction] = await Transaction.create(
      [{ userId: req.user._id, goalId, type: 'withdrawal', source: 'Manual', amount, note }],
      { session }
    );

    const newAmount = goal.currentAmount - amount;
    await SavingsGoal.findByIdAndUpdate(goalId, { currentAmount: newAmount }, { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      transaction,
      newAmount: parseFloat(newAmount.toFixed(2)),
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

/**
 * POST /api/transactions/transfer
 * Move money from one goal to another (Martin's feedback: change goal)
 */
router.post('/transfer', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromGoalId, toGoalId, amount, note } = req.body;

    if (!fromGoalId || !toGoalId || !amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'fromGoalId, toGoalId, and a positive amount are required' });
    }

    if (fromGoalId === toGoalId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same goal' });
    }

    const [fromGoal, toGoal] = await Promise.all([
      SavingsGoal.findOne({ _id: fromGoalId, userId: req.user._id }).session(session),
      SavingsGoal.findOne({ _id: toGoalId, userId: req.user._id, status: 'active' }).session(session),
    ]);

    if (!fromGoal) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Source goal not found' });
    }
    if (!toGoal) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Destination goal not found' });
    }
    if (amount > fromGoal.currentAmount) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Insufficient funds in source goal' });
    }

    // Record withdrawal from source
    await Transaction.create(
      [{
        userId: req.user._id,
        goalId: fromGoalId,
        type: 'withdrawal',
        source: 'Manual',
        amount,
        note: note || `Transferred to "${toGoal.title}"`,
      }],
      { session }
    );

    // Record deposit to destination
    await Transaction.create(
      [{
        userId: req.user._id,
        goalId: toGoalId,
        type: 'deposit',
        source: 'Manual',
        amount,
        note: note || `Transferred from "${fromGoal.title}"`,
      }],
      { session }
    );

    // Update both goal balances
    const newFromAmount = fromGoal.currentAmount - amount;
    const newToAmount = toGoal.currentAmount + amount;
    const toCompleted = newToAmount >= toGoal.targetAmount;

    await Promise.all([
      SavingsGoal.findByIdAndUpdate(fromGoalId, { currentAmount: newFromAmount }, { session }),
      SavingsGoal.findByIdAndUpdate(
        toGoalId,
        { currentAmount: newToAmount, ...(toCompleted && { status: 'completed' }) },
        { session }
      ),
    ]);

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: `$${amount} transferred from "${fromGoal.title}" to "${toGoal.title}"`,
      fromGoalNewAmount: parseFloat(newFromAmount.toFixed(2)),
      toGoalNewAmount: parseFloat(newToAmount.toFixed(2)),
      toGoalCompleted: toCompleted,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
