//returns an object containing the users info if found and returns undefined if not found
const findByEmail = function(userEmail, userDatabase) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === userEmail) {
      return { id: userDatabase[user].id, email: userDatabase[user].email, password: userDatabase[user].password};
    }
  }
  return undefined;
};

module.exports = { findByEmail };