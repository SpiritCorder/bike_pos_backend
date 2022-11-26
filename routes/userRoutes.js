const express = require('express');
const router = express.Router();

const {auth, isAdmin, isEmployee} = require('../middleware/auth');

const userControllers = require('../controllers/userControllers');

router.use(auth);


router.route('/') // /api/user/employee
    .get(isAdmin, userControllers.getAllUsers) // only for admins



// customer handling routes
router.route('/manage/customer')
    .post(isEmployee, userControllers.createNewCustomer) // create a new customer
    .get(isEmployee, userControllers.getAllCustomers); // get all customers

router.route('/manage/customer/:id')
    .get(isEmployee, userControllers.getCustomer) // get a customer
    .put(isEmployee, userControllers.updateCustomer) // update a customer
    .delete(isEmployee, userControllers.deleteCustomer) // delete a customer




// employee handling routes  
router.route('/employee')
    .get(isAdmin, userControllers.getAllEmployees)
    .post(isAdmin, userControllers.createNewEmployee)

router.route('/employee/:id')
    .get(isEmployee, userControllers.getEmployee)
    .put(isAdmin, userControllers.updateEmployee)
    .delete(isAdmin, userControllers.deleteEmployee)

module.exports = router;