"use strict";

const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 8080;


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));


let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15);
  }
  return string.substr(1,6);
}

//error variable
let errors = "";

//GET 

app.get('/', (req, res) => {
  //render index
  let tempVars = {user: userDB[req.session.user_id]};
  res.render('pages/index', tempVars);
});

app.get('/about', (req, res) => {
  //render about
  let tempVars = {user: userDB[req.session.user_id]};
  res.render('pages/about', tempVars);
});

app.get('/urls', (req, res) => {
  //render url index and display db contents
  let tempVars = {user: userDB[req.session.user_id], urls: urlDB};
  res.render('pages/urls_index', tempVars);
});

app.get('/urls/new', (req, res) => {
  //render new URL page
  let tempVars = {user: userDB[req.session.user_id]};
  res.render('pages/urls_new', tempVars);
});

app.get('/urls/:id', (req, res) => {
  //get url id
  let shortURLs = req.params.id;
  let tempVars = {user: userDB[req.session.user_id], shortURL: shortURLs, longURL: urlDB[shortURLs]}
  res.render('pages/urls_show', tempVars);
});

app.get('/register', (req, res) => {
  //render registration page
  let tempVars = {user: userDB[req.session.user_id], errors: errors};
  res.render('pages/register', tempVars);
});

app.get('/u/:shortURL', (req, res) => {
  //redirect to long URL from localhost:8080/u/shortURL
  let longURL = urlDB[req.params.shortURL];
  //check for valid shortened URL
  if(!longURL){
    res.statusCode = 404;
    res.send("Invalid short URL\n");
  }else{
    res.statusCode = 302;
    res.redirect(longURL);
  }
});

//POST

//get longURL and append to DB with random gen key
app.post('/urls', (req, res) => {
  let urlString = "";
  let check = new RegExp('http');
  //check if longURL is http format
  if(check.test(req.body.longURL)){
    urlString = req.body.longURL;
  }else{
    urlString = `http://${req.body.longURL}`
  }
  let randomString = generateRandomString();
  urlDB[randomString] = urlString;
  res.redirect(`/urls/${randomString}`);
});

//edit destination URL
app.post('/urls/:id', (req, res) => {
  let newURL = "";
  //check if longURL is http format
  let check = new RegExp('http');
  if(check.test(req.body.longURL)){
    newURL = req.body.longURL;
  }else{
    newURL = `http://${req.body.longURL}`
  }
  let urlID = req.params.id;
  urlDB[urlID] = newURL;
  res.redirect('/urls');
});

//delete URL
app.post('/urls/:id/delete', (req, res) => {
  
  let urlID = req.params.id;
  delete urlDB[urlID];
  res.redirect('/urls');
});

//User DB
let userDB = {
  "userID": {id: 'userID', username: 'example', passwordHash: 'hashedPword'}
};

//user registration
app.post('/register', (req, res) => {
  let username = req.body.userLogin;
  let password = req.body.password;
  let passwordCheck = req.body.confirmPassword;
  //check for errors
  //check for existing user
  for(let user in userDB) {
    if(user.username === username){
      console.log("DB username:", user, "Check value:", username);
      errors = `"${username}" is already taken!`;
      res.statusCode = 400;
      res.render('pages/register', {errors: errors, username: undefined});
    }  
  };
  //check for proper username and password format
  if(username.length < 5){
    console.log("Username must be at least 5 characters!");
    errors = 'Username must be at least 5 characters!';
  }else if(password.length < 5){
    console.log("Password must be at least 5 characters!");
    res.statusCode = 400;
    errors = 'Password must be at least 5 characters!';
    res.render('/register', {errors: errors, username: undefined});
  }else if(passwordCheck !== req.body.password) {
    console.log("Password:", req.body.password, "Confirmation:", passwordCheck);
    res.statusCode = 400;
    errors = 'Password and confirmation do not match!';
    res.render('pages/register', {errors: errors, username: undefined});
  }else{
    errors = undefined;
    //handle POST request
    //hash password
    let passwordHash = bcrypt.genSaltSync(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        return hash;
      });
    });
    let id = generateRandomString();
    //append user id, username and password hash to userDB
    userDB[id] = {id, username, passwordHash};
    console.log(userDB);
    req.session.user_id = id;
    res.redirect('/urls');
  }  
});

// **TODO: DEAL WITH PASSWORD FIELD, CHECK USERNAME AGAINST DB**
app.post('/login', (req, res) => {
  //login to site
  let username = req.body.userLogin;
  let password = req.body.password;
  let hashCheck = undefined;
  //check username length
  if(username.length < 1){
    res.statusCode = 400;
    errors = 'Please enter a username.';
    res.render('/login', {errors: errors});
  }
  //check against existing username in userDB 
  if(hashCheck === undefined){
    for(let user in userDB) {
      if(!user.hasOwnProperty(username)){
        errors = 'Invalid username or password.';
        res.statusCode = 400;
        res.render('/login', {errors: errors});
      }else{
        errors = undefined;
        hashCheck = bcrypt.compareSync(password, user.passwordHash, (err, res) => {
          return res;
        });
      }
    };
  }

  if(hashCheck === false){
    res.statusCode = 400;
    errors = 'Invalid username or password.';
    res.render('/login', {errors: errors});
  }else{
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  //logout 
  req.session = null;
  res.clearCookie("username");
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`TinyApp express server listening on port ${port}.`);
});

