//returns an object containing the users info if found and returns undefined if not found
const findByEmail = function(userEmail, userDatabase) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === userEmail) {
      return { id: userDatabase[user].id, email: userDatabase[user].email, password: userDatabase[user].password};
    }
  }
  return undefined;
};

//returns urls created by user
const findForUser = function(id, userDatabase) {
  const userUrlDatabase = {};
  for (const urls in userDatabase) {
    if (userDatabase[urls].userID === id) {
      userUrlDatabase[urls] = {longURL: userDatabase[urls].longURL , userID: id};
    }
  }
  return userUrlDatabase;
};

//returns random 7 digit string made up of numbers or letters via base 36 conversion
const generateRandomString = function() {
  return Math.random().toString(36).substring(7);
};

module.exports = { findByEmail, findForUser, generateRandomString };