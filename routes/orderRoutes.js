const express = require('express');
const router = express.Router();

const {auth, isEmployee} = require('../middleware/auth');

const orderControllers = require('../controllers/orderControllers');

router.use(auth);

// inplace order routes

router.route('/inplace')
    .post(isEmployee, orderControllers.createNewInplaceOrder) // create new inplace order, only for employees and admins

router.route('/inplace/employee/:id')
    .get(isEmployee, orderControllers.getAllEmployeeInplaceOrders) // get all inplace orders of an employee

router.route('/inplace/customer/:id')
    .get(orderControllers.getAllCustomerInplaceOrders) // get all inplace orders of an employee

router.route('/inplace/:id')
    .get(isEmployee, orderControllers.getInplaceOrder)
    .put(isEmployee, orderControllers.updateInplaceOrder)
    .delete(isEmployee , orderControllers.deleteInplaceOrder)


// online service order routes

router.route('/online-service')
    .post(orderControllers.createNewOnlineServiceOrder) // create a new online service order

router.route('/online-service/customer/:id')
    .get(orderControllers.getAllCustomerServiceOrders) // get all service orders of a customer

router.route('/online-service/employee/available')
    .get(isEmployee, orderControllers.getAllAvailableServiceOrders);

router.route('/online-service/employee/accept')
    .put(isEmployee, orderControllers.updateServiceOrderAcceptStatus);

router.route('/online-service/employee/update/:id')
    .put(isEmployee, orderControllers.updateServiceOrderPriceAndCompletion);

router.route('/online-service/:id')
    .get(orderControllers.getSingleServiceOrder) // get one service order
    .put(orderControllers.updateServiceOrder) // get one service order


// online purchase order routes

router.route('/online-purchase')
    .get(isEmployee, orderControllers.getAllPurchaseOrders)
    .post(orderControllers.createNewOnlinePurchaseOrder) // create a new online purchase order (customer, employee, admin)

router.route('/online-purchase/customer')
    .get(orderControllers.getLoggedInUserPurchaseOrders) // get all purchase orders of the logged in customer

router.route('/online-purchase/:id')
    .get(orderControllers.getSinglePurchaseOrder);

router.route('/online-purchase/:id/pay')
    .put(orderControllers.updatePurchaseOrderPaidStatus)

router.route('/online-purchase/:id/status')
    .put(isEmployee, orderControllers.updatePurchaseOrderStatus)



// employee sales routes

router.route('/employee/my/sales/:id')
    .get(isEmployee, orderControllers.getAllEmployeeSalesOrders);



module.exports = router;