const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { isAuth } = require('../middleware/auth');

// GET api/board/user/:id
router.get('/user/:id', isAuth, boardController.getUserEvaluations);

module.exports = router;
