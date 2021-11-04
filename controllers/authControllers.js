const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");

const User = require("../models/UserSchema");

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const passwordIsValid = await user.validatePassword(password);
    if (!passwordIsValid) {
      return res.status(401).json({ error: "Email and password do not match" });
    }

    // first parameter 'payload' has to be an object
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    /*  
      res.cookie(name, value [, options])
      Sets cookie 'name' to 'value'. The 'value' parameter may be a string or object converted to JSON.
      Check out possible 'options' fields from the link below. 
      * 'expires' option in documentation is now 'expire'. 
      http://expressjs.com/en/api.html#:~:text=res.-,cookie,-(name%2C%20value%20%5B%2C%20options
    */
    res.cookie("t", token, { expire: new Date(Date.now() + 8 * 3600000) });
    
    const { hashedPassword, ...otherUserProps } = user._doc;
    res.status(200).json({
      message: "Successfully logged in!",
      token,
      user: otherUserProps,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("t");
  res.status(200).json({ message: "Successfully logged out!" });
};

const requireLogin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
});

const hasAuthorization = (req, res, next) => {
  /* 
    req.auth is populated by express-jwt in 'requireLogin' function, under the userProperty option.
    req.auth looks like: { _id: '617e61790fb9d94ea9df3962', iat: 1635707695 }, where 'iat' = issued at.
  */
  const authorized = req.user && req.auth && req.user._id === req.auth._id;
  if (!authorized) {
    return res.status(403).json({ error: "User is not authorized" });
  }
  next();
};

module.exports = { login, logout, requireLogin, hasAuthorization };
