//jshint esversion:6
// dotenv package used to help encrypt/hide our "secret" encryption
require('dotenv').config(); // MUST BE THE FIRST LINE IN CODE
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

// configuring session and passport
app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());



// NOTE: The created mongoDB database won't appear in either mongo 
// shell or robo 3t until a document/object has been created
// and saved into said database
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
// slightly different from before
// this is now a object created with mongoose.Schema
// needed when wanted to use plugins! i.e .plugin()
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// NOTE: while running locally it the web app will
// remember the user is logged in but once we
// restart app.js the cookies will be deleted
// GOAL: use heroku alongside mongoAtlas to be 
// able to deploy web app via the server and
// solve the issue


app.get("/", function(req,res){
    res.render("home");
})
app.get("/login", function(req,res){
    res.render("login");
})
app.get("/register", function(req,res){
    res.render("register");
})
app.get("/secrets", function(req,res){
    User.find({secret:{$ne:null}}, function(err, foundUsers){
        if(err){
            console.log(err)
        }else{
            res.render("secrets", {
                usersWithSecrets: foundUsers
            })
        }
    })
})
app.get("/logout", function(req,res){
    // logout using passport
    req.logout();
    res.redirect("/");
})

app.get("/auth/google",
    passport.authenticate("google", {scope:['profile']})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
    
})

app.post("/register", function(req,res){
    // using the passport-local-mongoose package
    // returns err or the new registered user
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register");
        }else{
            // using passport we authenticate the user
            // sends cookie ot browser with user info(authorization)
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})
app.post("/login", function(req,res){
   const user = new User({
       username: req.body.username,
       password: req.body.password
   })

   req.login(user, function(err){
       if(err){
            console.log(err)
       }else{
            // using passport we authenticate the user
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
   })
})

app.listen(3000, function(){
    console.log("Server started on port 3000.");
});