const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST api/auth/login
router.post('/login', authController.login);

// POST api/auth/register
router.post('/register', authController.register);

// GET/POST api/auth/getregisdata
router.get('/getregisdata', authController.getRegisData);
router.post('/getregisdata', authController.getRegisData);

module.exports = router;
