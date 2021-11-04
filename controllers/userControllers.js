const bcrypt = require("bcryptjs");

const User = require("../models/UserSchema");

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("name email createdAt updatedAt");
    res.status(200).json(allUsers);
  } catch (err) {
    res.status(500).json(err);
  }
};

const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ name, email, hashedPassword });
    await newUser.save();
    res.status(200).json({ message: "Successfully signed up!" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const loadUserById = async (req, res, next, userId) => {
  try {
    const user = await User.findById(userId).select(
      "name email createdAt updatedAt"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json(err);
  }
};

const getUser = (req, res) => {
  try {
    const { password, ...otherUserProps } = req.user._doc;
    res.status(200).json(otherUserProps);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateUser = async (req, res) => {
  try {
    await User.updateOne(req.user, req.body);
    res.status(200).json({ message: "Update success!" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.deleteOne(req.user);
    res.status(200).json({ message: "Delete success!" });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  loadUserById,
  getUser,
  updateUser,
  deleteUser,
};
