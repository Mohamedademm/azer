const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const VALIDATED_STATUS_FILTER = { $regex: '^valid', $options: 'i' };

const buildDateMatch = ({ startDate, endDate, start, end } = {}) => {
  const from = startDate || start;
  const to = endDate || end;

  if (!from && !to) {
    return {};
  }

  const date = {};
  if (from) date.$gte = new Date(from);
  if (to) date.$lte = new Date(to);
  return { date };
};

const getMoneyFlowPipeline = (query = {}) => {
  const { category, accountId, limit = 500 } = query;
  const entryMatch = [];

  if (category) {
    entryMatch.push({
      $or: [
        { 'account.category': { $regex: category, $options: 'i' } },
        { 'account.name': { $regex: category, $options: 'i' } },
      ],
    });
  }

  if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
    entryMatch.push({ 'account._id': new mongoose.Types.ObjectId(accountId) });
  }

  return [
    {
      $match: {
        status: VALIDATED_STATUS_FILTER,
        ...buildDateMatch(query),
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
          { 'account.inMoneyFlow': true },
          { 'account.type': { $in: ['produit', 'charge', 'tresorerie'] } },
        ],
      },
    },
    ...(entryMatch.length ? [{ $match: { $and: entryMatch } }] : []),
    {
      $addFields: {
        flowAmount: {
          $switch: {
            branches: [
              { case: { $eq: ['$account.type', 'charge'] }, then: '$entries.debit' },
              { case: { $eq: ['$account.type', 'produit'] }, then: '$entries.credit' },
              { case: { $gt: ['$entries.debit', '$entries.credit'] }, then: '$entries.debit' },
            ],
            default: '$entries.credit',
          },
        },
        isExpense: {
          $or: [
            { $eq: ['$account.type', 'charge'] },
            {
              $and: [
                { $ne: ['$account.type', 'produit'] },
                { $gt: ['$entries.debit', '$entries.credit'] },
              ],
            },
          ],
        },
      },
    },
    { $match: { flowAmount: { $gt: 0 } } },
    {
      $project: {
        id: '$entries._id',
        transactionId: '$_id',
        transactionNumber: 1,
        date: 1,
        category: { $ifNull: ['$account.category', '$account.name'] },
        account: {
          id: '$account._id',
          code: '$account.code',
          name: '$account.name',
          type: '$account.type',
          category: '$account.category',
        },
        amount: { $round: ['$flowAmount', 2] },
        isExpense: 1,
        note: { $ifNull: ['$entries.label', '$description'] },
        description: 1,
        createdAt: 1,
      },
    },
    { $sort: { date: -1, createdAt: -1 } },
    { $limit: Math.min(parseInt(limit, 10) || 500, 5000) },
  ];
};

const summarizeEntries = (entries) => entries.reduce((acc, entry) => {
  if (entry.isExpense) {
    acc.expenses += entry.amount;
  } else {
    acc.revenues += entry.amount;
  }
  acc.net = acc.revenues - acc.expenses;
  return acc;
}, { revenues: 0, expenses: 0, net: 0 });

const getAll = async (req, res) => {
  try {
    const entries = await Transaction.aggregate(getMoneyFlowPipeline(req.query));
    const totals = summarizeEntries(entries);

    res.json({
      success: true,
      data: entries,
      totals: {
        revenues: Math.round(totals.revenues * 100) / 100,
        expenses: Math.round(totals.expenses * 100) / 100,
        net: Math.round(totals.net * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const entries = await Transaction.aggregate(getMoneyFlowPipeline({ ...req.query, limit: 5000 }));
    const totals = summarizeEntries(entries);
    const byCategory = entries.reduce((acc, entry) => {
      const key = entry.category || 'Autre';
      if (!acc[key]) acc[key] = { category: key, revenues: 0, expenses: 0, net: 0, count: 0 };
      if (entry.isExpense) acc[key].expenses += entry.amount;
      else acc[key].revenues += entry.amount;
      acc[key].net = acc[key].revenues - acc[key].expenses;
      acc[key].count += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totals,
        byCategory: Object.values(byCategory),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getStats,
  getMoneyFlowPipeline,
  summarizeEntries,
};
