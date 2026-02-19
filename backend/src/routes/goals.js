const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');

/**
 * GET /api/goals
 * Get all active savings goals for the logged-in user
 * Also returns the overall total saved across all goals (Martin's feedback)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query; // ?status=active|completed|cancelled

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 });

    // Overall total saved (sum of currentAmount across all active goals)
    const totalSaved = goals
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.currentAmount, 0);

    res.json({ success: true, goals, totalSaved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goals/:id
 * Get a single goal with its transaction log (Karla's feedback)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const transactions = await Transaction.find({ goalId: goal._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, goal, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/goals
 * Create a new savings goal
 */
router.post('/', protect, async (req, res) => {
  try {
    const { title, targetAmount, deadline, savingPlan, imageUrl, productUrl } =
      req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'title and targetAmount are required',
      });
    }

    const goal = await SavingsGoal.create({
      userId: req.user._id,
      title,
      targetAmount,
      deadline,
      savingPlan,
      imageUrl,
      productUrl,
    });

    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/goals/:id
 * Edit a savings goal (Juliana's feedback: adjust goal if things come up)
 */
router.patch('/:id', protect, async (req, res) => {
  try {
    const allowedUpdates = [
      'title',
      'targetAmount',
      'deadline',
      'savingPlan',
      'imageUrl',
      'productUrl',
      'status',
    ];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a savings goal and its transactions
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Clean up related transactions
    await Transaction.deleteMany({ goalId: goal._id });

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/goals/summary/savings-plan
 * Calculator: given targetAmount, deadline, and plan type,
 * returns how much to save per period
 */
router.post('/summary/savings-plan', protect, async (req, res) => {
  try {
    const { targetAmount, deadline, savingPlan, currentAmount = 0 } = req.body;

    if (!targetAmount || !deadline || !savingPlan) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const remaining = targetAmount - currentAmount;
    const now = new Date();
    const end = new Date(deadline);
    const diffMs = end - now;

    if (diffMs <= 0) {
      return res.status(400).json({ success: false, message: 'Deadline must be in the future' });
    }

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    let periodsLeft, amountPerPeriod;

    if (savingPlan === 'daily') {
      periodsLeft = Math.ceil(diffDays);
      amountPerPeriod = remaining / periodsLeft;
    } else if (savingPlan === 'weekly') {
      periodsLeft = Math.ceil(diffDays / 7);
      amountPerPeriod = remaining / periodsLeft;
    } else {
      // monthly
      periodsLeft = Math.ceil(diffDays / 30);
      amountPerPeriod = remaining / periodsLeft;
    }

    res.json({
      success: true,
      summary: {
        targetAmount,
        currentAmount,
        remaining: parseFloat(remaining.toFixed(2)),
        savingPlan,
        periodsLeft,
        amountPerPeriod: parseFloat(amountPerPeriod.toFixed(2)),
        deadline,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
