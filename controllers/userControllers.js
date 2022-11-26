const UserSchema = require('../models/User');
const bcrypt = require('bcryptjs');
const OrderSchema = require('../models/Order');


// @desc Get all users
// @route GET /api/users
// @access Private (Admins)

const getAllUsers = async (req, res, next) => {

    try {
        const users = await UserSchema.find().select('-password').sort({active: -1, createdAt: 1}).lean();

        if(users.length <= 0) {
            return res.status(400).json({message: 'No users found'});
        }

        res.status(200).json({message: 'Success', users})
    } catch (err) {
        next(err);
    }

}








/*
 -------------------------------------
            employee routes
 -------------------------------------
*/


// @desc get all employees
// @route GET /api/users/employee
// @access Private (Admins)

const getAllEmployees = async (req, res, next) => {
    try {
        const employees = await UserSchema.find({roles: 'Employee', isActive: true}).select('-password').lean().exec();

        res.status(200).json({message: 'Success', employees});

    } catch (err) {
        next(err);
    }
}

// @desc get single employee
// @route GET /api/users/employee/:id
// @access Private (Admins, Employee)

const getEmployee = async (req, res, next) => {
    const empId = req.params.id;

    if(req.user?.id.toString() !== empId.toString() && req.user?.roles.indexOf('Admin') === -1) {
        // not an admin as well as not the employee who has logged in
        return res.status(401).json({message: 'Unauthorized'});
    }

    try {
        const employee = await UserSchema.findById(empId).select('-password').lean().exec();

        res.status(200).json({message: 'Success', employee});
    } catch (err) {
        next(err);
    }
}

// @desc Create new employee
// @route POST /api/users/employee
// @access Private (Admins)

const createNewEmployee = async (req, res, next) => {
    const {username, password, roles} = req.body;
    
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'All fields are required'});
    }

    try {
        const duplicate = await UserSchema.findOne({username}).lean().exec();

        if(duplicate) {
            // status 409 - stands for conflict
            return res.status(409).json({message: 'Username already exists'});
        }

        // no existing user found, so hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            password: hashedPassword,
            roles,
            employee: req.body.employee ? req.body.employee : {}
        }

        // create and store new user
        const user = await UserSchema.create(newUser);

        if(user) {
            res.status(201).json({message: `User ${username} was created`});
        } else {
            res.status(400).json({message: 'Invalid user data received'});
        }

    } catch (err) {
        next(err);
    }

}

// @desc Update Employee
// @route PUT /api/users/employee/:id
// @access Private (Admin, Employee(only his profile data can be updated))

const updateEmployee = async (req, res, next) => {

    const id = req.params.id;

    if(req.user?.id.toString() !== id.toString() && req.user?.roles.indexOf('Admin') === -1) {
        // not an admin as well as not the employee who has logged in
        return res.status(401).json({message: 'Unauthorized'});
    }

    const {username, roles, password} = req.body;

    // data check
    if(!id || !username || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'Invalid user data'});
    }

    try {
        // find the existing user
        const user = await UserSchema.findById(id).exec();

        if(!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // check if the new username already exists
        const duplicate = await UserSchema.findOne({username}).lean().exec();

        if(duplicate && duplicate?._id.toString() !== id) {
            // this username already exists, so we cant update
            return res.status(409).json({message: 'User already exists with the username'});
        }

        user.username = username;
        user.roles = roles;
        user.employee = req.body.employee;

        if(password) {
            // update the password also 
            // hash the password
            user.password = await bcrypt.hash(password, 10);
        }

        // save the user
        const updatedUser = await user.save();

        res.status(200).json({message: `User ${updatedUser.username} was updated`})

    } catch(err) {
        next(err);
    }

}


// @desc remove an employee
// @route DELETE /api/users/employee/:id
// @access Private (Admin)

const deleteEmployee = async (req, res, next) => {

    const id = req.params.id;

    try {
        const employee = await UserSchema.findById(id).exec();

        if(!employee) return res.status(404).json({message: 'Employee not found'});

        const isHandled = await OrderSchema.findOne({$or: [{type: 'inplace', 'inplaceOrder.handledBy': id}, {type: 'online-service', 'onlineServiceOrder.handledBy': id}]}).lean().exec();

        if(isHandled) {
            employee.isActive = false;
            await employee.save();
        } else {
            await employee.remove();
        }
        res.status(200).json({message: 'Employee removed'});

    } catch (err) {
        next(err);
    }
}



/*
 -------------------------------------
            customer routes
 -------------------------------------
*/

// @desc Create new customer
// @route POST /api/users/manage/customer
// @access Private (Admin, Employee)

const createNewCustomer = async (req, res, next) => {
    const {username, password, firstName, lastName, email, phone, address, roles} = req.body;

    if(!username || !password || !firstName || !lastName || !email || !phone || !address || !Array.isArray(roles) || roles.length <= 0) {
        return res.status(422).json({message: 'Invalid Inputs'});
    }

    // check for the roles
    if(roles.length > 1 || roles.indexOf('Customer') === -1) {
        return res.status(422).json({message: 'Invalid role for customer'});
    }

    // check for username (whether if it already exists)
    try {
        const duplicate = await UserSchema.findOne({username});

        if(duplicate) {
            return res.status(400).json({message: 'Username already taken'});
        }

        const customer = {
            username,
            password,
            roles,
            customer: {
                firstName,
                lastName,
                address,
                email,
                phone
            }
        }

        // if no user found with the given username , then hash the password
        customer.password = await bcrypt.hash(password, 10);

        await UserSchema.create(customer);
        res.status(201).json({message: `Customer ${username} was created`});

    } catch (err) {
        next(err);
    }
}

// @desc get all customers
// @route GET /api/users/manage/customer
// @access Private (Admin, Employee)

const getAllCustomers = async (req, res, next) => {

    try {
        const customers = await UserSchema.find({roles: ['Customer'], isActive: true}).select('-password').lean().exec();

        res.status(200).json({message: 'Success', customers});
    } catch (err) {
        next(err);
    }
}


// @desc Update a customer
// @route PUT /api/users/manage/customer/:id
// @access Private (Admin, Employee)

const updateCustomer = async (req, res, next) => {
    const id = req.params.id;

    const {username, password, firstName, lastName, email, phone, address, roles} = req.body;

    if(!username || !firstName || !lastName || !email || !phone || !address || !Array.isArray(roles) || roles.length <= 0) {
        return res.status(422).json({message: 'Invalid Inputs'});
    }

    // check for the roles
    if(roles.length > 1 || roles.indexOf('Customer') === -1) {
        return res.status(422).json({message: 'Invalid role for customer'});
    }

    try {
        const existingCustomer = await UserSchema.findById(id).exec();

        if(!existingCustomer) {
            return res.status(404).json({message: 'Customer not found'});
        }

        if(existingCustomer.username !== username) {
            // they are trying to update the username, so check whether the new username already taken
            const duplicate = await UserSchema.findOne({username}).lean().exec();

            if(duplicate) return res.status(400).json({message: 'Username is already taken'});

        }

        // update the customer
        const customer = {
            firstName,
            lastName,
            address,
            email,
            phone 
        }

        existingCustomer.username = username;
        existingCustomer.roles = roles;
        existingCustomer.customer = customer;

        if(password) {
            existingCustomer.password = await bcrypt.hash(password, 10);
        }

        await existingCustomer.save();
        res.status(200).json({message: 'Customer info updated'});
    } catch (err) {
        next(err);
    }
}


// @desc Get a customer
// @route GET /api/users/manage/customer/:id
// @access Private (Admin, Employee)

const getCustomer = async (req, res, next) => {
    const id = req.params.id;

    try {
        const customer = await UserSchema.findById(id).select('-password').lean().exec();

        if(!customer) return res.status(404).json({message: 'Customer not found'});

        res.status(200).json({message: 'Success', customer});
    } catch (err) {
        next(err);
    }
}

// @desc Delete a customer
// @route DELETE /api/users/manage/customer/:id
// @access Private (Admin, Employee)

const deleteCustomer = async (req, res, next) => {
    const id = req.params.id;

    try {
        const customer = await UserSchema.findById(id).exec();

        if(!customer) return res.status(404).json({message: 'Customer not found'});

        // check whether the customer already have orders placed, if yes then just change the isActive to false
        const isPlaced = await OrderSchema.findOne({customer: id});

        if(isPlaced) {
            customer.isActive = false;
            await customer.save();
        } else {
            await customer.remove();
        }

        res.status(200).json({message: 'Success', customer});
    } catch (err) {
        next(err);
    }
}


module.exports = {
    getAllUsers,
    getAllEmployees,
    getEmployee,
    createNewEmployee,
    updateEmployee,
    deleteEmployee,

    createNewCustomer,
    getAllCustomers,
    updateCustomer,
    getCustomer,
    deleteCustomer
}

