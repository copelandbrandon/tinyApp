const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

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

//returns an object containing the users info if found and returns undefined if not found
const findByEmail = function(userEmail) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return { id: users[user].id, email: users[user].email, password: users[user].password};
    }
  }
  return undefined;
};

//finds urls created by user
const findForUser = function(id) {
  const userUrlDatabase = {};
  for (const urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      userUrlDatabase[urls] = {longURL: urlDatabase[urls].longURL , userID: id};
    }
  }
  console.log("user URL database", userUrlDatabase);
  return userUrlDatabase;
};

//home page route
app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res)=>{
  res.json(urlDatabase);
});


//registration page endpoint
app.get("/register", (req, res)=>{
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_registration", templateVars);
});

// registration submit handler
app.post("/register", (req, res)=>{
  const randomID = generateRandomString();
  const userInfo = findByEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "" || userInfo !== undefined) {
    res.sendStatus(400);
  }
  users[randomID] = { id: randomID, email: req.body.email, password: req.body.password};
  res.cookie("user_id", randomID);
  res.redirect("/urls");
});

//urls list endpoint
app.get("/urls", (req, res)=>{
  const userURL = findForUser(req.cookies["user_id"]);
  console.log(userURL);
  const templateVars = {urls: userURL, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

//add urls endpoint
app.get("/urls/new", (req, res)=>{
  if (req.cookies["user_id"] === undefined) {
    res.redirect("/login");
  }
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

//create new short url
app.post("/urls", (req, res)=>{
  let shortURL = generateRandomString();
  let newLongURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: newLongURL, userID: req.cookies["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

//delete existing url
app.post("/urls/:shortURL/delete", (req, res)=>{
  const shortURL = req.params.shortURL;
  const currentID = req.cookies["user_id"];
  if (urlDatabase[shortURL].userID === currentID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  res.send("Unauthorized delete attempt");
});

//logout route
app.post("/logout", (req,res)=>{
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//updates existing
app.post("/urls/:shortURL", (req, res)=>{
  const shortURL = req.params.shortURL;
  const newLong = req.body.longURL;
  const currentID = req.cookies["user_id"];
  if (urlDatabase[shortURL].userID === currentID) {
    urlDatabase[shortURL].longURL = newLong;
    res.redirect(`/urls/${shortURL}`);
  }
  res.send("Unauthorized update attempt");
});

//login route
app.get("/login", (req,res)=>{
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_login", templateVars);
});

//login handler
app.post("/login", (req, res)=>{
  const userEmail = req.body.email;
  const password = req.body.password;
  const userInfo = findByEmail(req.body.email);
  if (req.body.email === "" || userInfo === undefined) {
    res.sendStatus(403);
  } else if (userInfo.email === userEmail && userInfo.password !== password) {
    res.sendStatus(403);
  }
  res.cookie("user_id", userInfo.id);
  res.redirect("/urls");
});

// redirect for shortURL's
app.get("/u/:shortURL", (req, res)=>{
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res)=>{
  const userUrlDatabase = findForUser(req.cookies["user_id"]);
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("Requested URL does not exist");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]], urls: userUrlDatabase};
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
