const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const productRoute = require("./routes/product");



dotenv.config();

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("Database connection successful")).catch((err)=>{
    console.log(err)
})

/*
app.get("/api/test", ()=>{
    console.log("test is successful");
});
*/

app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);


app.listen(process.env.PORT || 5000, () => {
    console.log("Server is up and running");
})