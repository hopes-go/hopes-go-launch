const express = require('express');
const router = express.Router();
const controller = require('../controllers/ownerController');

// Owner: tracking (private), performance dashboards
router.get('/tracking', controller.getTracking);
router.get('/performance', controller.getPerformance);

module.exports = router;
