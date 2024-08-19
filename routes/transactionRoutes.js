const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactionById,
  updateTransactionStatus,
  listTransactions,
} = require('../controllers/transactionController');

// POST /api/transactions - Create a new transaction
router.post('/', createTransaction);

// GET /api/transactions/:id - Get a transaction by ID
router.get('/:id', getTransactionById);

// PUT /api/transactions/:id/status - Update the status of a transaction
router.put('/:id/status', updateTransactionStatus);

// GET /api/transactions - List all transactions
router.get('/', listTransactions);

module.exports = router;
