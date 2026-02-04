const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// GET api/user/data
router.get('/data', isAuth, userController.getUserData);

// GET api/user/time
router.get('/time', isAuth, userController.getAssessmentTime);

// GET api/user/form
router.get('/form', isAuth, userController.getAssessmentForm);

// POST api/user/result
router.post('/result', upload.array('file'), userController.saveResult);

module.exports = router;
