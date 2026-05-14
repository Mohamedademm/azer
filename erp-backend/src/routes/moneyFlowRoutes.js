const express = require('express');
const router = express.Router();
const moneyFlowController = require('../controllers/moneyFlowController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin_principal', 'admin_finance'));

router.get('/', moneyFlowController.getAll);
router.get('/stats', moneyFlowController.getStats);

module.exports = router;
