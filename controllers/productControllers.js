const ProductSchema = require('../models/Product');

// @desc Create New Product
// @route GET /api/products
// @access Private (Admin, Employee)

const createNewProduct = async (req, res, next) => {

    const {title, description, price, condition, state, colorVariation, supplier, imageCount} = req.body;

    if(!title || !description || !price || price <= 0 || !condition || !state || !supplier) {
        return res.status(422).json({message: 'Invalid Input'});
    }

    // check for all images
    if(imageCount !== 4) {
        return res.status(422).json({message: '4 Images are required'});
    }

    // check for 0 quantity
    let totalQty = 0;
    for(let key in colorVariation) {
        if(+colorVariation[key] > 0) {
            totalQty += +colorVariation[key];
        }
    }   

    if(totalQty <= 0) {
        return res.status(422).json({message: 'Product quantity cannot be empty'});
    }

    // create new product
    const newProduct = {
        title,
        description,
        price,
        condition,
        state,
        colorVariation,
        supplier
    }

    try {
        const product = await ProductSchema.create(newProduct);
        res.status(201).json({message: 'Product Created', product});
    } catch (err) {
        next(err);
    }

}

// @desc Update created product image urls
// @route PUT /api/products/:id/images
// @access Private (Admin, Employee)

const updateProductImages = async (req, res, next) => {
    const {images} = req.body;

    if(!Array.isArray(images) || images.length !== 4) {
        return res.status(422).json({message: 'Invalid input'});
    }

    const id = req.params.id;

    try {
        const product = await ProductSchema.findById(id).exec();

        if(!product) {
            return res.status(404).json({message: 'Product not found'});
        }

        product.images = images;
        await product.save();
        res.status(200).json({message: 'Product images updated'});
    } catch (err) {
        next(err);
    }
}


// @desc Get all products
// @route GET /api/products
// @access Private (Admin)

const getAllProducts = async (req, res, next) => {

    try {
        const products = await ProductSchema.find().populate('supplier').lean();

        res.status(200).json({message: 'Success', products});
    } catch (err) {
        next(err);
    }
}


// @desc Get single product
// @route GET /api/products/:id
// @access Private (Admin, Employee)

const getProduct = async (req, res, next) => {
    const id = req.params.id;

    try {
        const product = await ProductSchema.findById(id).lean().exec();

        res.status(200).json({message: 'Success', product});
    } catch (err) {
        next(err);
    }
}


// @desc Update product
// @route PUT /api/products/:id
// @access Private (Admin, Employee)

const updateProduct = async (req, res, next) => {
    const id = req.params.id;

    const {title, description, price, condition, state, colorVariation, supplier, imageCount} = req.body;

    if(!title || !description || !price || price <= 0 || !condition || !state || !supplier) {
        return res.status(422).json({message: 'Invalid Input'});
    }

    // check for all images
    if(imageCount !== 0 && imageCount !== 4) {
        return res.status(422).json({message: '4 Images are required'});
    }

    // check for 0 quantity
    let totalQty = 0;
    for(let key in colorVariation) {
        if(+colorVariation[key] > 0) {
            totalQty += +colorVariation[key];
        }
    }   

    if(totalQty <= 0) {
        return res.status(422).json({message: 'Product quantity cannot be empty'});
    }

    try {
        const product = await ProductSchema.findById(id).lean().exec();

        if(!product) return res.status(404).json({message: 'Product not found'});

        // update product details
        const newProduct = {
            title,
            description,
            price,
            condition,
            state,
            colorVariation,
            supplier
        }

        await ProductSchema.findOneAndUpdate({_id: id}, newProduct);

        res.status(200).json({message: 'Product updated'});
    } catch (err) {
        next(err);
    }
}

// @desc Delete Product
// @route DELETE /api/products/:id
// @access Private (Admin)

const deleteProduct = async (req, res, next) => {
    const id = req.params.id;

    try {
        const product = await ProductSchema.findById(id);

        if(!product) return res.status(404).json({message: 'Product not found'});

        await product.remove();

        res.status(200).json({message: 'Product removed', product});
    } catch (err) {
        next(err);
    }
}




// @desc Update(switch) product state
// @route PUT /api/products/:id/switch/state
// @access Private (Admin)

const updateProductState = async (req, res, next) => {
    const id = req.params.id;
    const {state} = req.body;

    if(!state) return res.status(422).json({message: 'Invalid Input'});

    try {
        const product = await ProductSchema.findById(id).exec();

        if(!product) return res.status(404).json({message: 'Product not found'});

        product.state = state;
        await product.save();
        res.status(200).json({message: 'Product State Updated'});
    } catch (err) {
        next(err);
    }
}


// @desc get all  products in the showroom
// @route GET /api/products/showroom
// @access Private (Customer, Admin, Employee)

const getAllShowroomProducts = async (req, res, next) => {
    try {
        const products = await ProductSchema.find({state: 'showroom'}).lean().exec();

        res.status(200).json({message: 'success', products});
    } catch (err) {
        next(err);
    }
}


// @desc get all cart products
// @route GET /api/products/cart-items
// @access Private (Customer, Admin, Employee)

const getAllCartProducts = async (req, res, next) => {
    let cartItems = req.query.items;

    cartItems = JSON.parse(cartItems);

    if(!cartItems || !Array.isArray(cartItems)) {
        return res.status(422).json({message: 'Invalid Inputs'});
    }

    const ids = cartItems.map(i => i._id);

    try {
        let products = await ProductSchema.find({_id: {$in: ids}, state: 'showroom'}).lean().exec();

        let acceptedProducts = [];

        cartItems.forEach(i => {
            const productItem = products.find(p => p._id.toString() === i._id);
            
            if(productItem.colorVariation[i.color] >= +i.qty) {
                const obj = {
                    ...i,
                    productData: {
                        title: productItem.title,
                        image: productItem.images[0],
                        price: productItem.price,
                        condition: productItem.condition,
                        productId: productItem.productId
                    }
                }
                acceptedProducts.push(obj);
            }
        })

        res.status(200).json({message: 'success', items: acceptedProducts});
    } catch (err) {
        next(err);
    }

}


module.exports = {
    createNewProduct,
    updateProductImages,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    updateProductState,
    getAllShowroomProducts,
    getAllCartProducts
}