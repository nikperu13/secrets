//jshint esversion:6
// dotenv package used to help encrypt/hide our "secret" encryption
require('dotenv').config(); // MUST BE THE FIRST LINE IN CODE
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// salting & hashing package
var bcrypt = require("bcrypt");

// needed to specify number of saltrounds for "bcrypt"
const saltRounds = 10;

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
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


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
   
    bcrypt.hash(req.body.password, saltRounds, function(err,hash){
        // for the password use "hash" that's being returned by
        // the bcrypt.hash anonymous function
        const newUser = new User ({
            email: req.body.username,
            password: hash
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

    
})
app.post("/login", function(req,res){
    const email = req.body.username
    const password = req.body.password

    // find requested user and check if the email and password
    // matches a current users credentials
    User.findOne({email: email},function(err,foundUser){
        if(!err){
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result){
                    // bcrypt.compare will an err or result(boolean) if the password
                    // matches after checking for salt rounds and hash
                    if(result === true){
                        res.render("secrets");
                    }
                })
            }
        }else{
            console.log(err);
        }
    })
})

app.listen(3000, function(){
    console.log("Server started on port 3000.");
});