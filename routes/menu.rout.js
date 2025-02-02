import express from "express";
import upload from "../middlewares/multer.js";
import {
  addMenu,
  deleteMenu,
  editMenu,
} from "../controller/menu.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/").post(isAuthenticated, upload.single("image"), addMenu);
router.route("/:id").post(isAuthenticated, upload.single("image"), editMenu);
router.route("/:id").delete(isAuthenticated, deleteMenu);

export default router;
