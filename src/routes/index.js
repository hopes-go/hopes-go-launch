const express = require('express');
const router = express.Router();

const customerRoutes = require('./customer');
const driverRoutes = require('./driver');
const ownerRoutes = require('./owner');

router.use('/customer', customerRoutes);
router.use('/driver', driverRoutes);
router.use('/owner', ownerRoutes);

router.get('/', (req, res) => res.json({ ok: true, service: 'hopes-go-launch API' }));

module.exports = router;
