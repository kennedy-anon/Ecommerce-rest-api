const router = require("express").Router();
const algoliasearch = require('algoliasearch');
const { verifyTokenAndAdmin } = require("./verifyToken");
const Product = require("../models/Product");


// for sending product titles to algolia
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    // Fetch data from database
    const products = await Product.find({}, { _id: 1, title: 1, desc: 1, categories: 1 });

    // Map the products to Algolia objects
    const records = products.map(product => ({
      objectID: product._id.toString(), // Set the objectID to the _id value from MongoDB
      title: product.title,
      desc: product.desc,
      categories: product.categories // Other attributes of the product object
    }));
    
    // Connect and authenticate with equickShop Algolia app
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

    // Create a new index and add records
    const index = client.initIndex('dev_equickShop');

    for (let record in records) {
      console.log(records[record]);
      await index.saveObject(records[record]); // sending records to algolia
    }

    // Search the index and return the results
    index
    .search('speaker')
    .then(({ hits }) => {
      let results = hits[0];
      res.status(200).json(results);
    })

  } catch (err) {
    res.status(500).json(err);
  }
})

module.exports = router