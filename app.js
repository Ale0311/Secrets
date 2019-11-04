//jshint esversion:6
require('dotenv').config();
const bcrypt =  require("bcrypt");
const express = require('express');
const bp = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bp.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//----------Setting up the schema----------//
const userSchema =  new mongoose.Schema({

  email: String,
  password: String

});


const User = mongoose.model('User', userSchema);

//----------Setting up the schema----------//


app.get("/", function(req, res) {

  res.render("home");
});

app.get("/login", function(req, res) {

  res.render("login");
});

app.post("/login", function(req, res) {

  const email = req.body.username;
  const pass = req.body.password;

  User.findOne({
    email: email
  }, function(err, response) {

    if (err) console.log(err);
else if(response){

  bcrypt.compare(pass, response.password, function(error, result) {
if (result === true)
res.render("secrets");
else  res.render("login");
});

    }
    else res.render("login");

  });

});

app.get("/register", function(req, res) {

  res.render("register");
});


app.post("/register", function(req, res) {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const em = req.body.username;
    console.log(em);
    const pass = hash;

    const newUser = new User({
      email: em,
      password: pass
    });

    User.findOne({
      email: em
    }, function(err, response) {

      if (err) console.log(err);
  else {
        if(response)
        res.render("register");

        else {
          newUser.save( function (err){
            if (err) console.log(err);

            else {
              res.render("secrets");
            }
          });
        }

      }

    });
  });


});



app.get("/submit", function(req, res) {

  res.render("submit");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
