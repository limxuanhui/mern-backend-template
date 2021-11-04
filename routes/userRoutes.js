const express = require("express");

const {
  hasAuthorization,
  requireLogin,
} = require("../controllers/authControllers");
const {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  loadUserById,
  updateUser,
} = require("../controllers/userControllers");

const router = express.Router();

router.get("/", getAllUsers);

router.post("/", createUser);

router.param("userId", loadUserById);

router.get("/:userId", requireLogin, getUser);

router.put("/:userId", requireLogin, hasAuthorization, updateUser);

router.delete("/:userId", requireLogin, hasAuthorization, deleteUser);

module.exports = router;
