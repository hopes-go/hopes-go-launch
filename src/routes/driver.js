const express = require('express');
const router = express.Router();
const controller = require('../controllers/driverController');

// Driver: auth, clock in/out, accept orders, geotag, chat
router.post('/login', controller.login);
router.post('/clockin', controller.clockIn);
router.post('/clockout', controller.clockOut);
router.post('/orders/:id/accept', controller.acceptOrder);
router.post('/orders/:id/geotag', controller.postGeotag);
router.get('/orders/:id', controller.getOrder);
router.post('/orders/:id/chat', controller.postChat);

module.exports = router;
