const express = require('express');
const router = express.Router();

const {auth} = require('../middleware/auth');

const profileControllers = require('../controllers/profileControllers');

router.use(auth);

router.route('/')
    .put(profileControllers.updateProfile) // update the auth user's profile data
    .get(profileControllers.getProfile); // get auth user's profile


module.exports = router;