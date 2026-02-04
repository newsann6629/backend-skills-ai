const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuth, isAdmin } = require('../middleware/auth');

// PUT api/admin/edituser
router.put('/edituser', isAdmin, adminController.editUser);

// POST api/admin/indicator
router.post('/indicator', isAdmin, adminController.addIndicator);

// GET api/admin/indicator
router.get('/indicator', isAdmin, adminController.getIndicators);

// GET api/admin/user
router.get('/user', isAdmin, adminController.getAllUsers);

// POST api/admin/time
router.post('/time', isAdmin, adminController.addRound);

// GET api/admin/time
router.get('/time', adminController.getRound);

// POST api/admin/section (mapped from addform in services.js)
router.post('/section', isAdmin, adminController.addSection);

// POST api/admin/group
router.post('/group', isAdmin, adminController.receiveGroup);

// GET api/admin/getuserresult
router.get('/getuserresult', isAuth, adminController.getUserResults);

module.exports = router;
