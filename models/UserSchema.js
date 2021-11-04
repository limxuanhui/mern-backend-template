const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/* 
  Do not declare methods using ES6 arrow functions (=>). 
  Arrow functions explicitly prevent binding 'this', so your method will not have access to the document.
  https://mongoosejs.com/docs/guide.html#:~:text=Do%20not%20declare%20methods%20using%20ES6%20arrow%20functions%20(%3D%3E).%20Arrow%20functions%20explicitly%20prevent%20binding%20this%2C%20so%20your%20method%20will%20not%20have%20access%20to%20the%20document%20and%20the%20above%20examples%20will%20not%20work.
*/
UserSchema.methods = {
  validatePassword: async function (password) {
    const passwordIsValid = await bcrypt.compare(password, this.hashedPassword);
    return passwordIsValid;
  },
};

/* 
  Add a third parameter as the collection name to be used in MongoDB.
  e.g. mongoose.model("User", UserSchema, "users") 
*/
module.exports = mongoose.model("User", UserSchema, "userstemplate");
