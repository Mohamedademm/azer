// src/controllers/financeController.js
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Account = require('../models/Account');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { getMoneyFlowPipeline, summarizeEntries } = require('./moneyFlowController');

// @desc    Export Excel des transactions
// @route   GET /api/finance/export/excel
const exportFinanceExcel = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('validatedBy', 'firstName lastName')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'N° Transaction', key: 'number', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Total Débit', key: 'debit', width: 15 },
      { header: 'Total Crédit', key: 'credit', width: 15 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Créé par', key: 'createdBy', width: 20 }
    ];

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    transactions.forEach(t => {
      worksheet.addRow({
        number: t.transactionNumber,
        date: t.date.toLocaleDateString('fr-FR'),
        description: t.description,
        debit: t.totalDebit,
        credit: t.totalCredit,
        status: t.status,
        createdBy: t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : 'N/A'
      });
    });

    worksheet.getColumn('debit').numFmt = '#,##0.00';
    worksheet.getColumn('credit').numFmt = '#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export PDF des transactions
// @route   GET /api/finance/export/pdf
const exportFinancePDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { status: 'validé' };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .populate('entries.account', 'code name')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=journal_comptable.pdf');
    doc.pipe(res);

    // En-tête
    doc.fontSize(20).text('JOURNAL COMPTABLE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Période: ${startDate || 'Début'} au ${endDate || new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    let y = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Date', 50, y);
    doc.text('N°', 120, y);
    doc.text('Description', 200, y);
    doc.text('Débit', 450, y);
    doc.text('Crédit', 520, y);

    y += 20;
    doc.font('Helvetica');

    transactions.forEach(transaction => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(7);
      doc.text(transaction.date.toLocaleDateString('fr-FR'), 50, y);
      doc.text(transaction.transactionNumber, 120, y);
      doc.text(transaction.description.substring(0, 30), 200, y);
      doc.text(transaction.totalDebit.toFixed(2), 450, y);
      doc.text(transaction.totalCredit.toFixed(2), 520, y);
      
      y += 15;

      // Afficher les écritures
      transaction.entries.forEach(entry => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.fontSize(6);
        doc.text(`  ${entry.account?.code || ''}`, 200, y);
        doc.text(entry.label || '', 250, y);
        doc.text(entry.debit?.toFixed(2) || '', 450, y);
        doc.text(entry.credit?.toFixed(2) || '', 520, y);
        y += 12;
      });

      y += 8;
    });

    doc.end();
  } catch (error) {
    console.error('Erreur export PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dashboard financier
// @route   GET /api/finance/dashboard
const getFinanceDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Chiffre d'affaires du mois
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['payée', 'envoyée'] },
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalTTC' }
        }
      }
    ]);

    // Dépenses du mois
    const monthlyExpenses = await Transaction.aggregate([
      {
        $match: {
          status: 'validé',
          date: { $gte: startOfMonth }
        }
      },
      {
        $unwind: '$entries'
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'entries.account',
          foreignField: '_id',
          as: 'accountInfo'
        }
      },
      {
        $match: {
          'accountInfo.type': 'charge'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$entries.debit' }
        }
      }
    ]);

    // Trésorerie
    const cashAccounts = await Account.find({ 
      category: { $in: ['banque', 'caisse'] },
      isActive: true 
    });

    const cashBalance = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Créances clients
    const receivables = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['envoyée', 'partiellement_payée', 'en_retard'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountDue' }
        }
      }
    ]);

    // Dettes fournisseurs
    const supplierAccount = await Account.findOne({ code: '401' });
    let payables = 0;
    
    if (supplierAccount) {
      const supplierTransactions = await Transaction.aggregate([
        {
          $match: {
            status: 'validé',
            'entries.account': supplierAccount._id
          }
        },
        {
          $unwind: '$entries'
        },
        {
          $match: {
            'entries.account': supplierAccount._id,
            'entries.credit': { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$entries.credit' }
          }
        }
      ]);
      payables = supplierTransactions[0]?.total || 0;
    }

    // Revenus annuels
    const yearlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['payée', 'envoyée'] },
          date: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalTTC' }
        }
      }
    ]);

    // Dépenses annuelles
    const yearlyExpenses = await Transaction.aggregate([
      {
        $match: {
          status: 'validé',
          date: { $gte: startOfYear }
        }
      },
      {
        $unwind: '$entries'
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'entries.account',
          foreignField: '_id',
          as: 'accountInfo'
        }
      },
      {
        $match: {
          'accountInfo.type': 'charge'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$entries.debit' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenue: {
          monthly: monthlyRevenue[0]?.total || 0,
          yearly: yearlyRevenue[0]?.total || 0
        },
        expenses: {
          monthly: monthlyExpenses[0]?.total || 0,
          yearly: yearlyExpenses[0]?.total || 0
        },
        profit: {
          monthly: (monthlyRevenue[0]?.total || 0) - (monthlyExpenses[0]?.total || 0),
          yearly: (yearlyRevenue[0]?.total || 0) - (yearlyExpenses[0]?.total || 0)
        },
        cash: cashBalance,
        receivables: receivables[0]?.total || 0,
        payables: payables
      }
    });
  } catch (error) {
    console.error('Erreur dashboard financier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Statistiques financières générales
// @route   GET /api/finance/stats
const getFinanceStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Stats du mois
    const monthStats = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalTTC' },
          paidAmount: { $sum: '$amountPaid' }
        }
      }
    ]);

    // Stats de l'année
    const yearStats = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalTTC' }
        }
      }
    ]);

    // Nombre de transactions
    const transactionCount = await Transaction.countDocuments({ 
      status: 'validé',
      date: { $gte: startOfMonth }
    });

    res.json({
      success: true,
      data: {
        currentMonth: {
          invoices: monthStats[0]?.totalInvoices || 0,
          amount: monthStats[0]?.totalAmount || 0,
          paid: monthStats[0]?.paidAmount || 0,
          transactions: transactionCount
        },
        currentYear: {
          invoices: yearStats[0]?.totalInvoices || 0,
          amount: yearStats[0]?.totalAmount || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UN SEUL export à la fin avec TOUTES les fonctions
const groupMonthlyMoneyFlow = (entries) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });
  const map = new Map();

  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: formatter.format(date),
        revenues: 0,
        expenses: 0,
        net: 0,
      });
    }

    const row = map.get(key);
    if (entry.isExpense) row.expenses += entry.amount;
    else row.revenues += entry.amount;
    row.net = row.revenues - row.expenses;
  });

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const getCashFlow = async (req, res) => {
  try {
    const entries = await Transaction.aggregate(getMoneyFlowPipeline({ ...req.query, limit: 5000 }));
    const totals = summarizeEntries(entries);

    res.json({
      success: true,
      data: {
        entries,
        monthly: groupMonthlyMoneyFlow(entries),
        totals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfitLoss = async (req, res) => {
  try {
    const entries = await Transaction.aggregate(getMoneyFlowPipeline({ ...req.query, limit: 5000 }));
    const revenues = entries.filter((entry) => !entry.isExpense);
    const expenses = entries.filter((entry) => entry.isExpense);
    const totals = summarizeEntries(entries);

    res.json({
      success: true,
      data: {
        period: req.query.period || 'monthly',
        revenues,
        expenses,
        totals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBalanceSheet = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const balance = await Account.getBalanceSheet(date);
    const accounts = await Account.find({
      isActive: true,
      type: { $in: ['actif', 'passif', 'tresorerie'] },
    }).sort('code');

    res.json({
      success: true,
      data: {
        date,
        ...balance,
        accounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFinancialRatios = async (req, res) => {
  try {
    const [balance, entries, cashAccounts] = await Promise.all([
      Account.getBalanceSheet(new Date()),
      Transaction.aggregate(getMoneyFlowPipeline({ limit: 5000 })),
      Account.find({ isActive: true, category: { $in: ['banque', 'caisse'] } }),
    ]);

    const totals = summarizeEntries(entries);
    const cash = cashAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const liabilities = Math.max(balance.liabilities || 0, 1);

    res.json({
      success: true,
      data: {
        liquidity: Math.round((cash / liabilities) * 100) / 100,
        profitability: totals.revenues > 0
          ? Math.round((totals.net / totals.revenues) * 10000) / 100
          : 0,
        debtRatio: balance.assets > 0
          ? Math.round((balance.liabilities / balance.assets) * 10000) / 100
          : 0,
        cash,
        totals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getForecasts = async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months, 10) || 6, 24);
    const entries = await Transaction.aggregate(getMoneyFlowPipeline({ limit: 5000 }));
    const monthly = groupMonthlyMoneyFlow(entries);
    const sample = monthly.slice(-6);
    const avgRevenue = sample.length
      ? sample.reduce((sum, row) => sum + row.revenues, 0) / sample.length
      : 0;
    const avgExpenses = sample.length
      ? sample.reduce((sum, row) => sum + row.expenses, 0) / sample.length
      : 0;

    const forecast = Array.from({ length: months }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() + index + 1);
      return {
        month: date.toISOString().slice(0, 7),
        revenues: Math.round(avgRevenue * 100) / 100,
        expenses: Math.round(avgExpenses * 100) / 100,
        net: Math.round((avgRevenue - avgExpenses) * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: {
        basedOnMonths: sample.length,
        forecast,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exportFinanceExcel,
  exportFinancePDF,
  getFinanceDashboard,
  getFinanceStats,
  getCashFlow,
  getProfitLoss,
  getBalanceSheet,
  getFinancialRatios,
  getForecasts,
};
