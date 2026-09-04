const express = require('express');
const router = express.Router();
const controller = require('../controllers/customerController');

// Customer: request delivery (select type), view orders, chat
router.post('/request', controller.createRequest);
router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.post('/orders/:id/chat', controller.postChat);

module.exports = router;
