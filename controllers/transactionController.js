const Transaction = require('../models/Transaction');

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const { bookingId, amount, status, paymentMethod, paymentId, note } = req.body;

  try {
    const transaction = new Transaction({
      bookingId,
      amount,
      status,
      paymentMethod,
      paymentId,
      note,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('bookingId');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update the status of a transaction
exports.updateTransactionStatus = async (req, res) => {
  const { status, note } = req.body;

  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = status || transaction.status;
    transaction.note = note || transaction.note;
    await transaction.save();

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all transactions
exports.listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('bookingId').sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
