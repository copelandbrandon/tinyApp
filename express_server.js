const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const { findByEmail, findForUser, generateRandomString } = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["superSecretKey", "secondSuperSecretKey"]
}));

//hardcoded users will not be able to log in due to password hashing
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

//home page endpoint
app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

//registration page endpoint
app.get("/register", (req, res)=>{
  if (req.session.userId !== undefined) {
    return res.redirect("/urls");
  }
  const templateVars = {user: users[req.session.userId]};
  return res.render("urls_registration", templateVars);
});

// registration submit endpoint
app.post("/register", (req, res)=>{
  const randomID = generateRandomString();
  const userInfo = findByEmail(req.body.email, users);
  if (req.body.email === "" || req.body.password === "" || userInfo !== undefined) {
    const templateVars = {
      email: req.body.email,
      password: req.body.password,
      userInfo: userInfo,
      user: users[req.session.userId]
    };
    return res.render("urls_registration_failure", templateVars);
  }
  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.userId = randomID;
  return res.redirect("/urls");
});

//urls list endpoint
app.get("/urls", (req, res)=>{
  const userURL = findForUser(req.session.userId, urlDatabase);
  const templateVars = {urls: userURL, user: users[req.session.userId]};
  return res.render("urls_index", templateVars);
});

//add urls endpoint
app.get("/urls/new", (req, res)=>{
  if (req.session.userId === undefined) {
    return res.redirect("/login");
  }
  const templateVars = {user: users[req.session.userId]};
  return res.render("urls_new", templateVars);
});

//create new short url endpoint
app.post("/urls", (req, res)=>{
  let shortURL = generateRandomString();
  let newLongURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL: newLongURL, userID: req.session.userId};
  return res.redirect(`/urls/${shortURL}`);
});

//delete existing url endpoint
app.post("/urls/:shortURL/delete", (req, res)=>{
  const shortURL = req.params.shortURL;
  const currentID = req.session.userId;
  if (urlDatabase[shortURL].userID === currentID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  return res.send("Unauthorized delete attempt");
});

//logout endpoint
app.post("/logout", (req,res)=>{
  req.session = null;
  return res.redirect("/urls");
});

//updates existing url endpoint
app.post("/urls/:shortURL", (req, res)=>{
  const shortURL = req.params.shortURL;
  const newLong = req.body.longURL;
  const currentID = req.session.userId;
  if (urlDatabase[shortURL].userID === currentID) {
    urlDatabase[shortURL].longURL = newLong;
    return res.redirect("/urls");
  }
  return res.send("Unauthorized update attempt");
});

//login endpoint
app.get("/login", (req,res)=>{
  if (req.session.userId !== undefined) {
    return res.redirect("/urls");
  }
  const templateVars = {user: users[req.session.userId]};
  return res.render("urls_login", templateVars);
});

//login submit endpoint
app.post("/login", (req, res)=>{
  const userEmail = req.body.email;
  const password = req.body.password;
  const userInfo = findByEmail(req.body.email, users);
  if (req.body.email === "" || userInfo === undefined) {
    return res.status(403).send("Error: Status Code 403, please register for an account first");
  } else if (userInfo.email === userEmail && bcrypt.compareSync(password, userInfo.password) !== true) {
    return res.status(403).send("Error: Status Code 403, invalid password.");
  }
  req.session.userId = userInfo.id;
  return res.redirect("/urls");
});

// redirect for shortURL's
app.get("/u/:shortURL", (req, res)=>{
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.send("Not a valid short URL, please try again.");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(longURL);
});

//individual link page endpoint
app.get("/urls/:shortURL", (req, res)=>{
  const userUrlDatabase = findForUser(req.session.userId, urlDatabase);
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.send("Requested URL does not exist");
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.userId],
    urls: userUrlDatabase
  };
  return res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
