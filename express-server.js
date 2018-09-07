"use strict";
//require dependencies`
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 8080;

//configure app 
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

//**functions**

//random string gen for userID and short URL
function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15);
  }
  return string.substr(1,6);
}

//function for adding URL to DB
function dbAdd(user, randomNum, longURL){
  urlDB[user][randomNum] = longURL;
}

//check for shortURL in DB
function isInDB(shortURL, userID){
  if(!userID){
    return false;
  }else{
    return Object.values(urlDB[userID]).includes(shortURL);
  }
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
  let tempVars = {user: userDB[userID], urls: urlDB[userID]};
  res.render('pages/urls_index', tempVars);
});

//render new URL page
app.get('/urls/new', (req, res) => {
  if(!req.session.user_id){
    errors = "Please login or register below to create a new URL!";
    res.render('pages/login', {errors: errors, user: undefined});
  }else{
    let tempVars = {user: userDB[req.session.user_id]};
    res.render('pages/urls_new', tempVars);
  }
});

//get url id
app.get('/urls/:id', (req, res) => {
  let userID = req.session.user_id;
  let shortURLs = req.params.id;
  console.log("IsInDB:", isInDB(shortURLs, userID));
  if(userID && isInDB(shortURLs, userID)){
    let tempVars = {user: userDB[userID], shortURL: shortURLs, longURL: urlDB[userID][shortURLs]};
    res.render('pages/urls_show', tempVars);
  }else{
    errors = "You don't have access to this URL! Login below for access, or register to create your own!";
    res.render('pages/login', {errors: errors, user: undefined});
  }
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
  let shortURL = req.params.shortURL;
  let longURL = '';
  for(let user in urlDB){
    let userObj = urlDB[user];
    if(userObj.hasOwnProperty(shortURL)){
      longURL = userObj[shortURL];
    }
  }
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

//get longURL and append to DB with random gen key
app.post('/urls', (req, res) => {
  let userID = req.session.user_id;
  let urlString = "";
  let check = new RegExp('http');

  //check if userID is undefined
  if(!userID){
    res.statusCode = 401;
    res.send("You aren't logged in!");
    //check if longURL is http format
  }else if(check.test(req.body.longURL)){
    urlString = req.body.longURL;
  }else{
    urlString = `http://${req.body.longURL}`;
  }
  let randomString = generateRandomString();
  if(urlDB[userID] === undefined){
    urlDB[userID] = {[randomString]: urlString};
  }else{
    dbAdd(userID, randomString, urlString);
  }
  res.redirect(`/urls/${randomString}`);
});

//edit destination URL
app.post('/urls/:id', (req, res) => {
  let userID = req.session.user_id;
  let newURL = "";
  //check if longURL is http format
  let check = new RegExp('http');
  if(check.test(req.body.longURL)){
    newURL = req.body.longURL;
  }else{
    newURL = `http://${req.body.longURL}`;
  }
  let urlID = req.params.id;
  urlDB[userID][urlID] = newURL;
  res.redirect('/urls');
});

//delete URL
app.post('/urls/:id/delete', (req, res) => {
  let userID = req.session.user_id;
  let urlID = req.params.id;
  delete urlDB[userID][urlID];
  res.redirect('/urls');
});

//user registration
app.post('/register', (req, res) => {
  let username = req.body.userLogin;
  let password = req.body.password;
  let passwordCheck = req.body.confirmPassword;
  let userExists = false;
  //check for existing user
  for(let user in userDB) {
    if(user.username === username){
      userExists = true;
      break;
    }
  };
  if(userExists){
    errors = `"${username}" is already taken!`;
    res.statusCode = 400;
    res.render('pages/register', {errors: errors, user: undefined});
  }
  //check for proper username and password format
  if(username.length < 5){
    res.statusCode = 400;
    errors = 'Username must be at least 5 characters!';
    res.render('pages/register', {errors: errors, user: undefined});
  }else if(password.length < 5){
    res.statusCode = 400;
    errors = 'Password must be at least 5 characters!';
    res.render('pages/register', {errors: errors, user: undefined});
  }else if(passwordCheck !== req.body.password) {
    res.statusCode = 400;
    errors = 'Password and confirmation do not match!';
    res.render('pages/register', {errors: errors, user: undefined});
  }else{
    //reset errors if conditions failed on previous attempts
    errors = '';
    //handle POST request
    //hash password
    let salt = bcrypt.genSaltSync(10);
    let passwordHash = bcrypt.hashSync(password, salt);
    
    //Generate random ID and append user id, username and password hash to userDB
    let id = generateRandomString();
    userDB[id] = {id, username, passwordHash};
    req.session.user_id = id;
    res.redirect('/urls');
  }  
});

//site login
app.post('/login', (req, res) => {

  let usernameInput = req.body.userLogin;
  let password = req.body.password;
  let hashCheck = false;
  let isUser = false;
  //check username length
  if(usernameInput.length < 1){
    res.statusCode = 400;
    errors = 'Please enter a username.';
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
  }
  //check against existing username in userDB 
  for(let user_id in userDB) {
    let user = userDB[user_id];
    if(user.username === usernameInput){
      isUser = true;
      //compare input password to DB hash
      
      hashCheck = bcrypt.compareSync(password, user.passwordHash);
      
      //eval hashCheck
      if(hashCheck === false){
        res.statusCode = 400;
        errors = 'Invalid username or password.';
        res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
      }else{
        req.session.user_id = user.id;
        res.redirect('/urls');
      }
    } 
  }
  if(isUser === false){
    errors = 'Invalid username or password.';
    res.statusCode = 400;
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
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

