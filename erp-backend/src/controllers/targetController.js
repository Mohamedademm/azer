const mongoose = require('mongoose');
const FinanceTarget = require('../models/FinanceTarget');
const Transaction = require('../models/Transaction');

const calcRealisedAmount = async (target) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        status: { $regex: '^valid', $options: 'i' },
        date: { $gte: target.startDate, $lte: target.endDate },
      },
    },
    { $unwind: '$entries' },
    {
      $lookup: {
        from: 'accounts',
        localField: 'entries.account',
        foreignField: '_id',
        as: 'account',
      },
    },
    { $unwind: '$account' },
    {
      $match: {
        $or: [
          { 'account.category': { $regex: target.category, $options: 'i' } },
          { 'account.name': { $regex: target.category, $options: 'i' } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalCredit: { $sum: '$entries.credit' },
        totalDebit: { $sum: '$entries.debit' },
      },
    },
  ]);

  const totals = result[0] || { totalCredit: 0, totalDebit: 0 };
  return Math.max(totals.totalCredit, totals.totalDebit);
};

const formatTarget = async (target) => {
  const realisedAmount = await calcRealisedAmount(target);
  const progression = target.amount > 0 ? Math.min((realisedAmount / target.amount) * 100, 999) : 0;

  return {
    id: target._id,
    category: target.category,
    amount: target.amount,
    realisedAmount: Math.round(realisedAmount * 100) / 100,
    progression: Math.round(progression * 100) / 100,
    startDate: target.startDate,
    endDate: target.endDate,
    status: target.status,
    notes: target.notes,
    createdAt: target.createdAt,
    updatedAt: target.updatedAt,
  };
};

const getAll = async (req, res) => {
  try {
    const { status, category, limit = 100 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: 'i' };

    const targets = await FinanceTarget.find(filter)
      .sort({ endDate: 1, createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 1000));

    res.json({
      success: true,
      data: await Promise.all(targets.map(formatTarget)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID cible invalide' });
    }

    const target = await FinanceTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Cible non trouvee' });
    }

    res.json({ success: true, data: await formatTarget(target) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { category, amount, startDate, endDate, status, notes } = req.body;

    if (!category || amount === undefined || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Categorie, montant et date de fin sont requis',
      });
    }

    const target = await FinanceTarget.create({
      category,
      amount,
      startDate: startDate || new Date(),
      endDate,
      status,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: await formatTarget(target),
      message: 'Cible financiere creee',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID cible invalide' });
    }

    const updates = { ...req.body, updatedBy: req.user._id };
    const target = await FinanceTarget.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'Cible non trouvee' });
    }

    res.json({
      success: true,
      data: await formatTarget(target),
      message: 'Cible financiere mise a jour',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID cible invalide' });
    }

    const target = await FinanceTarget.findByIdAndDelete(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Cible non trouvee' });
    }

    res.json({ success: true, message: 'Cible financiere supprimee' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
