const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    title:{type: String, required: true, unique: true},
    desc:{type: String, required: true},
    img:{data: Buffer, contentType: String},
    categories:{type: Array},
    size:{type: String},
    color:{type: String},
    price:{type: Number, required: true},
    count:{type: Number}//can be enforced to required
},
{timestamps: true}
)

module.exports = mongoose.model("Product", ProductSchema)