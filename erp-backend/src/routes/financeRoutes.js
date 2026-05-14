const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin_principal', 'admin_finance'));

router.get('/dashboard', financeController.getFinanceDashboard);
router.get('/stats', financeController.getFinanceStats);
router.get('/cashflow', financeController.getCashFlow);
router.get('/profit-loss', financeController.getProfitLoss);
router.get('/balance-sheet', financeController.getBalanceSheet);
router.get('/ratios', financeController.getFinancialRatios);
router.get('/forecasts', financeController.getForecasts);

router.get('/export/excel', financeController.exportFinanceExcel);
router.get('/export/excel/:type', financeController.exportFinanceExcel);
router.get('/export/pdf', financeController.exportFinancePDF);
router.get('/export/pdf/:type', financeController.exportFinancePDF);

module.exports = router;
