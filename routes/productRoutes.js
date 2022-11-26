const express = require('express');
const router = express.Router();

const {auth, isAdmin, isEmployee} = require('../middleware/auth');

const productControllers = require('../controllers/productControllers');

router.use(auth);

router.route('/')
    .get(isAdmin, productControllers.getAllProducts)
    .post(isEmployee, productControllers.createNewProduct) // create new product (Admin, Employee)

router.route('/showroom')
    .get(productControllers.getAllShowroomProducts);

router.route('/cart-items')
    .get(productControllers.getAllCartProducts);

router.route('/:id')
    .get(productControllers.getProduct) // get single product by id
    .put(isEmployee, productControllers.updateProduct) // update single product
    .delete(isAdmin, productControllers.deleteProduct) // delete a product completly

router.route('/:id/images')
    .put(isEmployee, productControllers.updateProductImages)

router.route('/:id/switch/state')
    .put(isAdmin, productControllers.updateProductState)

module.exports = router;