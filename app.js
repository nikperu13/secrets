//jshint esversion:6
// dotenv package used to help encrypt/hide our "secret" encryption
require('dotenv').config(); // MUST BE THE FIRST LINE IN CODE
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
// hashing package
var md5 = require("md5")

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

// NOTE: The created mongoDB database won't appear in either mongo 
// shell or robo 3t until a document/object has been created
// and saved into said database
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

// slightly different from before
// this is now a object created with mongoose.Schema!
// needed in order to use "encrypt" with it. i.e mongoose-encryption
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// Create a secret string and use userSchema.plugin() to use it
// encryptedFields:["",""] allows us to pick and choose which fields/parameters
// we want to be encrypted
// when we .save() a new object it will encrypt it
// when we .find() an object it will decrypt its 

// Behind the scenes "encrypt" will encrypt the password field
// using "secret" string
// const secret = "Thisisourlittlesecret."
// For more security we will use a .env file and write out "secret"
// encryption key there. Then to use it here from the .env file we 
// use process.env.SECRET 
/// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

// We will use "md5" package instead to hash our
// password! (line 64)

const User = mongoose.model("User", userSchema)


app.get("/", function(req,res){
    res.render("home");
})
app.get("/login", function(req,res){
    res.render("login");
})
app.get("/register", function(req,res){
    res.render("register");
})
app.post("/register", function(req,res){
   
    const newUser = new User ({
        email: req.body.username,
        password: md5(req.body.password)
    });

    // Once user is created only then can they see 
    // the secrets page
    // if no error send user to secrets page
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }else{
            console.log(err)
        }
    })
})
app.post("/login", function(req,res){
    const email = req.body.username
    // when using md5 we need to compare the password
    // in its hash form in order to check if they
    // are the same!
    const password = md5(req.body.password)

    // find requested user and check if the email and password
    // matches a current users credentials
    User.findOne({email: email},function(err,foundUser){
        if(!err){
            if(foundUser){
                if(password === foundUser.password){
                    res.render("secrets")
                }
                else{
                    res.render("login")
                }
            }
        }else{
            console.log(err)
        }
    })
})

app.listen(3000, function(){
    console.log("Server started on port 3000.");
});