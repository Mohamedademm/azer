const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin_principal', 'admin_finance'));

router.get('/', targetController.getAll);
router.post('/', targetController.create);
router.get('/:id', targetController.getById);
router.put('/:id', targetController.update);
router.delete('/:id', targetController.delete);

module.exports = router;
