import express from "express";
import upload from "../middlewares/multer.js";
import {
  addMenu,
  deleteMenu,
  editMenu,
  getRestaurantMenus,
} from "../controller/menu.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/addMenu").post(isAuthenticated, upload.single("image"), addMenu);
router
  .route("/menus/:id")
  .put(isAuthenticated, upload.single("image"), editMenu);
router.route("/deleteMenu/:id").delete(isAuthenticated, deleteMenu);
router.route("/").get(isAuthenticated, getRestaurantMenus);

export default router;
