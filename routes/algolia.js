const router = require("express").Router();
const algoliasearch = require('algoliasearch');
const { verifyTokenAndAdmin } = require("./verifyToken");
const Product = require("../models/Product");

// Fetch data from database
const fetchDataFromDatabase = async () => {
    const products = await Product.find({}, { _id: 1, title: 1 });

    // Map the products to Algolia objects
    const algoliaObjects = products.map(product => ({
      objectID: product._id.toString(), // Set the objectID to the _id value from MongoDB
      title: product.title, // Other attributes of the product object
    }));

    return algoliaObjects;

}


// for sending product titles to algolia
router.post("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    // Connect and authenticate with equickShop Algolia app
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

    // Create a new index and add records
    const index = client.initIndex('dev_equickShop');
    const records = await fetchDataFromDatabase();
    index.saveObject(records).wait();

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