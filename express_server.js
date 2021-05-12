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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//returns random 7 digit string made up of numbers or letters via base 36 conversion
const generateRandomString = function() {
  return Math.random().toString(36).substring(7);
};

//returns true if email is found otherwise returns false
const findEmail = function(userEmail) {
  for (let user in users) {
    console.log("user ID: ",users[user].email);
    if (users[user].email === userEmail) {
      return true;
    }
  }
  return false;
};

//home page route
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res)=>{
  res.json(urlDatabase);
});
//hello route
app.get("/hello", (req, res)=>{
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

//registration page endpoint
app.get("/register", (req, res)=>{
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_registration", templateVars)
});

// registration submit handler
app.post("/register", (req, res)=>{
  const randomID = generateRandomString();
  if (req.body.email === "" || req.body.password === "" || findEmail(req.body.email) === true) {
    res.sendStatus(400);
  }
  users[randomID] = { id: randomID, email: req.body.email, password: req.body.password}
  res.cookie("user_id", randomID);
  res.redirect("/urls")
  console.log(users);
});

//urls list endpoint
app.get("/urls", (req, res)=>{
  const templateVars = {urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
 });

//add urls endpoint
app.get("/urls/new", (req, res)=>{
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

//create new short url
app.post("/urls", (req, res)=>{
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//delete existing url
app.post("/urls/:shortURL/delete", (req, res)=>{
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
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
  urlDatabase[shortURL] = newLong;
  res.redirect(`/urls/${shortURL}`)
});

//login route
app.get("/login", (req,res)=>{
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("/urls_login", templateVars);
});

// redirect for shortURL's
app.get("/u/:shortURL", (req, res)=>{
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

 //individual url page endpoint
// app.get("/urls/:shortURL", (req, res)=>{
//   const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"]};
//   res.render("urls_show", templateVars);
// });


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
