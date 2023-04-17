const { default: mongoose } = require("mongoose");
const Order = require("../models/Order");

const { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./verifyToken");

const router = require("express").Router();

// Create new Order
router.post("/", verifyToken, async (req, res) => {
    const newOrder = new Order(req.body);
    try {
        const savedOrder = await newOrder.save();
        res.status(200).json(savedOrder);
    } catch (err) {
        res.status(500).json(err);
    }
});

//update Order details
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {

    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        res.status(200).json(updatedOrder);
    } catch (err) {
        res.status(500).json(err);
    }
});


//delete Order
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json("Order deleted.");
    } catch (err) {
        res.status(500).json(err);
    }
})


// get product list for a particular order
router.get("/productList/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.aggregate([
            //matching order with the given id
            { $match: {_id: mongoose.Types.ObjectId(orderId) } },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails'},
            {
                $group: {
                    _id: '$_id',
                    products: {
                        $push: {
                            title: '$productDetails.title',
                            quantity: '$products.quantity',
                            price: '$productDetails.price',
                            img: '$productDetails.img'
                        }
                    }
                }
            }
        ]);

        res.status(200).json(order)
    } catch (err) {
        res.status(500).json(err);
    }
})



// get user Orders using userId ...passed param is userId
router.get("/find/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.id });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json(err);
    }
})

//get all Orders
router.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json(err);
    }
});

//get monthly income
router.get("/income", verifyTokenAndAdmin, async (req, res) => {
    const date = new Date();
    const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
    const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

    try {
        const income = await Order.aggregate([
            { $match: { createdAt: { $gte: previousMonth } } },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    sales: "$amount",
                },
            },

            {
                $group: {
                    _id: "$month",
                    total: { $sum: "$sales" },
                },
            },
        ]);
        res.status(200).json(income);
    } catch (err) {
        //console.log(err);
        res.status(500).json(err);
    }
})


// script to update productID field to objectID ...to allow $lookup
router.put('/updateProductId/:id', verifyTokenAndAdmin, async (req, res) => {
    try{
        const orders = await Order.find({});

        for (const order of orders) {
        const updatedProducts = order.products.map(product => {
            const productId = mongoose.Types.ObjectId(product.productId);
            return { ...product, productId };
        });

        await Order.updateOne({ _id: order._id }, { $set: { products: updatedProducts } });
        // console.log(`Order ${order._id} updated successfully.`);
        }

        res.send('Update Complete!');
    } catch(err) {
        res.status(500).send(err);
    }
})


module.exports = router