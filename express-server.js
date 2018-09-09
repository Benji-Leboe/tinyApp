"use strict";
//require dependencies
const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const popper = require('popper');
const app = express();
const port = 8080;

//configure app 
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));
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

//viewDB for analytics
let viewDB = {
  visitors: [],
  urlID: {views: 0, uniqueViews: 0}
}

//User DB
let userDB = {
  "userID": {id: 'userID', username: 'example', passHash: 'pword'}
};

//**helper functions**
//set cookie data
function setCookie(req, option, param){
  return req.session[option] = param;
}

//random string gen for userID and short URL
function generateRandomString(){
  let string = "";
  for(let i = 0; i <= 6; i++){
    string += Math.random().toString(36).substr(2, 15);
  }
  return string.substr(1,6);
}

// add to viewDB.visitor array
function addVisitor(req){
  if(viewDB.visitors.length < 1){
    viewDB.visitors.push({
      user_id: req.session.user_id,
      visitor_id: req.session.visitor_id,
      timestamp: Date().toString()
    });
  }else{
    viewDB.visitors.unshift({
      user_id: req.session.user_id,
      visitor_id: req.session.visitor_id,
      timestamp: Date().toString()
    });
  }
}

//add views to DB
function viewDBAdd(urlID, value){
  if(!viewDB.hasOwnProperty(urlID)){
    viewDB[urlID] = {views: 0, uniqueViews: 0};
  }else{
    viewDB[urlID][value] += 1;
  }
}

//count views and unique views
function viewCounter(req, urlID){
  if(req.session.isNew){
    viewDBAdd(urlID, 'uniqueViews');
    setCookie(req, 'visitor_id', generateRandomString());
  }
  viewDBAdd(urlID, 'views');
  addVisitor(req);
}

//function for adding URL to DB
function dbAdd(user, randomNum, longURL){
  urlDB[user][randomNum] = longURL;
}

//check for shortURL in DB
function urlInDB(shortURL){
  for(let userID in urlDB){
    let userObj = urlDB[userID];
    if(userObj.hasOwnProperty(shortURL)){
      return true;
    }
  }
  return false;
}

//check for username in userDB
function isUsername(username){
  for(let userID in userDB){
    let users = userDB[userID];
    if(Object.values(users).includes(username)){
      return true;
    }
  }
  return false;
}

//validates user
function isUser(user_id, username){
  for(let user in userDB){
    let userID = userDB[user];
    if(user_id === user && userID.username === username){
      return true;
    }
  }
  return false;
}

//check for http prefix
function httpCheck(url){
  let check = new RegExp('http');
  return check.test(url);
}

//hash password
function passHasher(password){
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

//compare input password to DB hash
function hashCheck(password, hash){
  return bcrypt.compareSync(password, hash);
}

//check for min length
function isMinLength(input, length){
  if(input.length > length){
    return true;
  }
  return false;
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
  let tempVars = {user: userDB[userID], urls: urlDB[userID], viewDB: viewDB, visitors: viewDB.visitors};
  res.render('pages/urls_index', tempVars);
});

//render new URL page
app.get('/urls/new', (req, res) => {
  if(req.session.user_id === undefined){
    errors = "Please login or register below to create a new URL!";
    res.render('pages/login', {errors: errors, user: undefined});
  }else{
    let tempVars = {user: userDB[req.session.user_id], errors: errors};
    res.render('pages/urls_new', tempVars);
  }
});

//get url id
app.get('/urls/:id', (req, res) => {
  let userID = req.session.user_id;
  let shortURLs = req.params.id;
  if(userID){
    let tempVars = {user: userDB[userID], shortURL: shortURLs, longURL: urlDB[userID][shortURLs]};
    res.render('pages/urls_show', tempVars);
  }else{
    errors = "You don't have access to this URL! Login below for access, or register to create your own!";
    res.render('pages/login', {errors: errors, user: undefined});
  }
});

//render registration page
app.get('/register', (req, res) => {
  setCookie(req, 'user_id', undefined);
  errors = '';
  if(req.session.user_id !== undefined){
    res.redirect('/urls');
  }else{
    let tempVars = {user: userDB[req.session.user_id], errors: errors};
    res.render('pages/register', tempVars);
  }
});

//render login page
app.get('/login', (req, res) => {
  setCookie(req, 'user_id', undefined);
  errors = '';
  if(req.session.user_id !== undefined){
    res.redirect('/urls');
  }else{
    let tempVars = {user: userDB[req.session.user_id], errors: errors};
    res.render('pages/login', tempVars);
  }
});

//redirect to long URL from localhost:8080/u/shortURL
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = '';
  viewCounter(req, shortURL);
  for(let user in urlDB){
    let userObj = urlDB[user];
    if(userObj.hasOwnProperty(shortURL)){
      longURL = userObj[shortURL];
    }
  }
  //check for valid shortened URL
  if(urlInDB(shortURL)){
    res.statusCode = 302;
    res.redirect(longURL);
  }else{
    res.statusCode = 404;
    res.send("Invalid short URL. Please check your shortened URL and try again");
  }
});

//POST routing

//get longURL and append to DB with random gen key
app.post('/urls', (req, res) => {
  let userID = req.session.user_id;
  let urlString = "";
  let randomString = generateRandomString();
  errors = "";
  
  //check if userID is undefined
  if(!userID){
    res.statusCode = 401;
    errors = "You aren't logged in! Log in or register to add a URL.";
    res.render('pages/login', {errors: errors, user: undefined});
    //check if longURL is http format
  }else if(!isMinLength(req.body.longURL, 0)){
    res.statusCode = 400;
    res.redirect('/urls');
  }else if(httpCheck(req.body.longURL)){
    urlString = req.body.longURL;
  }else if(!httpCheck(req.body.longURL)){
    urlString = `http://${req.body.longURL}`;
  }
  
  if(!urlDB[userID] && urlString){
    urlDB[userID] = {[randomString]: urlString};
    viewDBAdd(randomString);
    res.redirect(`/urls/${randomString}`);
  }else if(urlDB[userID] && urlString) {
    dbAdd(userID, randomString, urlString);
    viewDBAdd(randomString);
    res.redirect(`/urls/${randomString}`);
  }
});

//edit destination URL
app.put('/urls/:id', (req, res) => {
  let userID = req.session.user_id;
  let newURL = "";
  //check if longURL is http format
  if(!isMinLength(req.body.longURL, 0)){
    res.statusCode = 400;
    res.redirect('/urls');  
  }else if(httpCheck(req.body.longURL)){
    newURL = req.body.longURL;
  }else{
    newURL = `http://${req.body.longURL}`;
  }
  let urlID = req.params.id;
  urlDB[userID][urlID] = newURL;
  res.redirect('/urls');
});

//delete URL
app.delete('/urls/:id/delete', (req, res) => {
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

  //check for existing user
  
  if(isUsername(username)){
    errors = `"${username}" is already taken!`;
    res.statusCode = 400;
    res.render('pages/register', {errors: errors, user: undefined});
  }else 
  //check for proper username and password format
  if(!isMinLength(username, 4)){
    errors = 'Username must be at least 5 characters!';
    res.statusCode = 400;
    res.render('pages/register', {errors: errors, user: undefined});
  }else if(!isMinLength(password, 4)){    
    errors = 'Password must be at least 5 characters!';
    res.statusCode = 400;
    res.render('pages/register', {errors: errors, user: undefined});
  }else if(passwordCheck !== password) {
    errors = 'Password and confirmation do not match!';
    res.statusCode = 400;
    res.render('pages/register', {errors: errors, user: undefined});
  }else{
    //reset errors if conditions failed on previous attempts
    errors = '';
    let passHash = passHasher(password);
    //handle POST request
    //Generate random ID and append user id, username and password hash to userDB
    let id = generateRandomString();
    userDB[id] = {id, username, passHash};

    setCookie(req, 'user_id', id);
    res.redirect('/urls');
  }  
});

//site login
app.post('/login', (req, res) => {
  let username = req.body.userLogin;
  let password = req.body.password;
  //check username length
  if((!isMinLength(username, 0) || !isMinLength(password, 0))){
    res.statusCode = 400;
    errors = 'Please enter a username and password.';
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
  //check against existing username in userDB 
  }else if(!isUsername(username)){
    errors = 'Invalid username or password.';
    res.statusCode = 400;
    res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
  }else{
    for(let user_id in userDB) {
      let user = userDB[user_id];
      
      if(isUser(user_id, username)){
        //eval hashCheck
        if(hashCheck(password, user.passHash)){
          setCookie(req, 'user_id', user.id);
          res.redirect('/urls');
          break;
        }else{
          res.statusCode = 400;
          errors = 'Invalid username or password.';
          res.render('pages/login', {user: userDB[req.session.user_id], errors: errors});
          break;
        }
      } 
    }  
  }
});

//logout 
app.post('/logout', (req, res) => {
  setCookie(req, "user_id", undefined);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`TinyApp express server listening on port ${port}.`);
});

