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
  .route("/restaurant/update")
  .post(isAuthenticated, upload.single("restaurantImage"), createRestaurant);
router.route("/").get(isAuthenticated, getRestaurant);
router
  .route("/restaurant/edit")
  .put(isAuthenticated, upload.single("restaurantImage"), updateRestaurant);
router.route("/order").get(isAuthenticated, getRestaurantOrder);
router.route("/order/:orderId/status").post(isAuthenticated, updateOrderStatus);
router.route("/search/:searchText").post(isAuthenticated, searchRestaurant);
router.route("/:id").post(isAuthenticated, getSingleRestaurant);

export default router;
