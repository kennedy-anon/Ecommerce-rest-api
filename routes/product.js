const Product = require("../models/Product");
const { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./verifyToken");
const { MongoServerError } = require("mongodb")

const router = require("express").Router();
const multer = require("multer");

var fs = require('fs');
var path = require('path');


//storage -for product images
const storage  = multer.diskStorage({
    destination: 'productImages',
    filename: (req, file, cb) =>{
        cb(null, Date.now() + '-' + file.originalname);
        //console.log(file);
    },
});

// Multer Filter //for filtering files that are not images
const multerFilter = (req, file, cb) => {
    var imagesEx = file.mimetype.split("/")[1];

    if ((imagesEx === "png") || (imagesEx === "jpeg") || (imagesEx === "jpg")) {
      cb(null, true);
    } else {
        //res.send("Not an image.");
      cb(new Error("Not an image File!!"), false);
    }
  };

const upload = multer({
    storage: storage,
    fileFilter: multerFilter,
}).single('img')


// Add new product
router.post("/", verifyTokenAndAdmin, async (req, res)=>{
    upload(req, res, (err)=>{
        if (err){
            // browser set to allow only image files
            res.status(500).json("Not an Image File!!");
        }else{
            const newProduct = new Product({
                title: req.body.title,
                desc: req.body.desc,
                img:{
                    data: fs.readFileSync(path.join(__dirname, '..', 'productImages', req.file.filename)),
                    //data: req.file.filename,
                    contentType: 'image/png'
                },
                categories: req.body.categories,
                size: req.body.size,
                color: req.body.color,
                price: req.body.price,
                count: req.body.count
            })

            newProduct.save()
            .then((savedProduct)=>res.status(200).json(newProduct.title + " added successfully.")).catch((err)=>{
                //console.log(err);
                if (err instanceof MongoServerError && err.code === 11000){
                    fs.unlink(path.join(__dirname, '..', 'productImages', req.file.filename), (err)=>{
                        if (err){
                            //console.log(err);
                        }
                    });
                    res.status(409).json({msg: 'The product arleady exists in the database.'});
                }else{
                    res.status(500).json(err);
                }
                })
        }
    })
});

//update product details
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {

    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        }, { new: true });
        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(500).json(err);
    }
});


//delete product
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json("Product deleted.");
    } catch (err) {
        res.status(500).json(err);
    }
})

// get a product
router.get("/find/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json(err);
    }
})

//get all products
router.get("/", async (req, res) => {
    const qNew = req.query.new
    const qCategory = req.query.category

    try {
        let products;
        if (qNew){
            products = await Product.find().sort({createdAt: -1}).limit(5);
        }else if(qCategory){
            products = await Product.find({categories:{
                $in: [qCategory],
            }});
        }else{
            products = await Product.find();
        }

        res.status(200).json(products);
    } catch (err) {
        res.status(500).json(err);
    }
})

module.exports = router