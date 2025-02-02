import express from "express";
import {
  createRestaurant,
  getRestaurant,
  getRestaurantOrder,
  getSingleRestaurant,
  searchRestaurant,
  updateOrderStatus,
  updateRestaurant,
} from "../controller/restaurant.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router
  .route("/")
  .post(isAuthenticated, upload.single("imageFile"), createRestaurant);
router.route("/").get(isAuthenticated, getRestaurant);
router
  .route("/")
  .put(isAuthenticated, upload.single("imageFile"), updateRestaurant);
router.route("/order").get(isAuthenticated, getRestaurantOrder);
router.route("/order/:orderId/status").post(isAuthenticated, updateOrderStatus);
router.route("/search/:searchText").post(isAuthenticated, searchRestaurant);
router.route("/:id").post(isAuthenticated, getSingleRestaurant);

export default router;
