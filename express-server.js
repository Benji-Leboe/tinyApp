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

//error variable
let errors = "";

//**Databases**

//URL DB
let urlDB = {
  userID: {"b2xVn2": "http://www.lighthouselabs.ca", "9sm5xK": "http://www.google.com"}
};

//User DB
let userDB = {
  "userID": {id: 'userID', username: 'example', passwordHash: 'pword'}
};

function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15);
  }
  return string.substr(1,6);
}

//**GET routing**
//render index
app.get('/', (req, res) => {
  let tempVars = {user: userDB[req.session.user_id]};
  res.render('pages/index', tempVars);
});

//render about
app.get('/about', (req, res) => { 
  let tempVars = {user: userDB[req.session.user_id]};
  res.render('pages/about', tempVars);
});

//render url index and display db contents
app.get('/urls', (req, res) => {
  let userID = req.session.user_id;
  let tempVars = {user: userDB[userID], urls: urlDB[userID], dbUsers: urlDB};
  res.render('pages/urls_index', tempVars);
});

//render new URL page
app.get('/urls/new', (req, res) => {
  if(!req.session.user_id){
    res.redirect('/');
  }else{
    let tempVars = {user: userDB[req.session.user_id]};
    console.log(urlDB);
    res.render('pages/urls_new', tempVars);
  }
});

//get url id
app.get('/urls/:id', (req, res) => {
  let userID = req.session.user_id;
  let shortURLs = req.params.id;
  let tempVars = {user: userDB[userID], shortURL: shortURLs, longURL: urlDB[userID][shortURLs]}
  res.render('pages/urls_show', tempVars);
});

//render registration page
app.get('/register', (req, res) => {
  let tempVars = {user: userDB[req.session.user_id], errors: errors};
  res.render('pages/register', tempVars);
});

//render login page
app.get('/login', (req, res) => {
  let tempVars = {user: userDB[req.session.user_id], errors: errors};
  res.render('pages/login', tempVars);
});

//redirect to long URL from localhost:8080/u/shortURL
app.get('/u/:shortURL', (req, res) => {
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

//POST routing
function dbAdd(user, randomNum, longURL){
  urlDB[user][randomNum] = longURL;
}
//get longURL and append to DB with random gen key
app.post('/urls', (req, res) => {
  let userID = req.session.user_id;
  let urlString = "";
  let check = new RegExp('http');
  //check if longURL is http format
  if(check.test(req.body.longURL)){
    urlString = req.body.longURL;
  }else{
    urlString = `http://${req.body.longURL}`
  }
  let randomString = generateRandomString();
  if(urlDB[userID] === undefined){
    urlDB[userID] = {[randomString]: urlString}
  }else{
    dbAdd(userID, randomString, urlString);
  }
  console.log(urlDB);
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
    res.statusCode = 400;
    errors = 'Username must be at least 5 characters!';
  }else if(password.length < 5){
    res.statusCode = 400;
    errors = 'Password must be at least 5 characters!';
    res.render('/register', {errors: errors, username: undefined});
  }else if(passwordCheck !== req.body.password) {
    res.statusCode = 400;
    errors = 'Password and confirmation do not match!';
    res.render('pages/register', {errors: errors, username: undefined});
  }else{
    //reset errors if conditions failed previously
    errors = undefined;
    //handle POST request
    //hash password
    let passwordHash = bcrypt.genSaltSync(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        return hash;
      });
    });
    //Generate random ID and append user id, username and password hash to userDB
    let id = generateRandomString();
    userDB[id] = {id, username, passwordHash};
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
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
  }
  //check against existing username in userDB 
  if(hashCheck === undefined){
    for(let user in userDB) {
      if(!user.hasOwnProperty(username)){
        errors = 'Invalid username or password.';
        res.statusCode = 400;
        res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
      }else{
        //reset errors from unmet conditions and compare input password to DB hash
        errors = undefined;
        hashCheck = bcrypt.compareSync(password, user.passwordHash, (err, res) => {
          return res;
        });
      }
    };
  }

  //evaluate hashCheck
  if(hashCheck === false){
    res.statusCode = 400;
    errors = 'Invalid username or password.';
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
  }else{
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

//logout 
app.post('/logout', (req, res) => {
  req.session = null;
  res.clearCookie("user_id");
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`TinyApp express server listening on port ${port}.`);
});

