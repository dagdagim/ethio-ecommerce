const express = require('express');
const {
    initiateTeleBirr,
    initiateChapa,
    chapaWebhook,
    teleBirrWebhook,
    confirmCOD,
    processBankTransfer
} = require('../controllers/payments');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/telebirr', protect, initiateTeleBirr);
router.post('/chapa', protect, initiateChapa);
router.post('/telebirr/webhook', teleBirrWebhook);
router.post('/chapa/webhook', chapaWebhook);
router.post('/cod', protect, confirmCOD);
router.post('/bank-transfer', protect, processBankTransfer);

module.exports = router;