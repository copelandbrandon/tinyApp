const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const { findByEmail } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["superSecretKey", "secondSuperSecretKey"]
}));

const users = {
  "randomUserID": {
    id: "randomUserID",
    email: "user@example.com",
    password: "examplePassword"
  },
  "randomUserID2": {
    id:"randomUserID2",
    email:"user2@example.com",
    password: "examplePassword2"
  }
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "randomUserID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "randomUserID"}
};

//returns random 7 digit string made up of numbers or letters via base 36 conversion
const generateRandomString = function() {
  return Math.random().toString(36).substring(7);
};

//finds urls created by user
const findForUser = function(id) {
  const userUrlDatabase = {};
  for (const urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      userUrlDatabase[urls] = {longURL: urlDatabase[urls].longURL , userID: id};
    }
  }
  return userUrlDatabase;
};

//home page route
app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res)=>{
  res.json(urlDatabase);
});


//registration page endpoint
app.get("/register", (req, res)=>{
  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_registration", templateVars);
});

// registration submit endpoint
app.post("/register", (req, res)=>{
  const randomID = generateRandomString();
  const userInfo = findByEmail(req.body.email, users);
  if (req.body.email === "" || req.body.password === "" || userInfo !== undefined) {
    return res.sendStatus(400);
  }
  users[randomID] = { id: randomID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10)};
  req.session.user_id = randomID;
  res.redirect("/urls");
});

//urls list endpoint
app.get("/urls", (req, res)=>{
  const userURL = findForUser(req.session.user_id);
  const templateVars = {urls: userURL, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

//add urls endpoint
app.get("/urls/new", (req, res)=>{
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  }
  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});

//create new short url
app.post("/urls", (req, res)=>{
  let shortURL = generateRandomString();
  let newLongURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: newLongURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

//delete existing url
app.post("/urls/:shortURL/delete", (req, res)=>{
  const shortURL = req.params.shortURL;
  const currentID = req.session.user_id;
  if (urlDatabase[shortURL].userID === currentID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  res.send("Unauthorized delete attempt");
});

//logout route
app.post("/logout", (req,res)=>{
  req.session.user_id = null;
  res.redirect("/urls");
});

//updates existing
app.post("/urls/:shortURL", (req, res)=>{
  const shortURL = req.params.shortURL;
  const newLong = req.body.longURL;
  const currentID = req.session.user_id;
  if (urlDatabase[shortURL].userID === currentID) {
    urlDatabase[shortURL].longURL = newLong;
    return res.redirect(`/urls/${shortURL}`);
  }
  return res.send("Unauthorized update attempt");
});

//login route
app.get("/login", (req,res)=>{
  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_login", templateVars);
});

//login submit endpoint
app.post("/login", (req, res)=>{
  const userEmail = req.body.email;
  const password = req.body.password;
  const userInfo = findByEmail(req.body.email, users);
  if (req.body.email === "" || userInfo === undefined) {
   return res.sendStatus(403);
  } else if (userInfo.email === userEmail && bcrypt.compareSync(password, userInfo.password) !== true) {
    return res.sendStatus(403);
  }
  req.session.user_id = userInfo.id;
  return res.redirect("/urls");
});

// redirect for shortURL's
app.get("/u/:shortURL", (req, res)=>{
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
//individual link page endpoint
app.get("/urls/:shortURL", (req, res)=>{
  const userUrlDatabase = findForUser(req.session.user_id);
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("Requested URL does not exist");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id], urls: userUrlDatabase};
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
