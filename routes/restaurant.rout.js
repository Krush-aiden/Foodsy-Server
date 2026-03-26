import express from "express";
import {
  cancelOrder,
  createOrder,
  createRestaurant,
  getRestaurant,
  getRestaurantOrder,
  getSingleRestaurant,
  getUserOrders,
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
router.route("/order/create").post(isAuthenticated, createOrder);
router.route("/order/user").get(isAuthenticated, getUserOrders);
router.route("/order/:orderId/status").post(isAuthenticated, updateOrderStatus);
router.route("/order/:orderId/cancel").post(isAuthenticated, cancelOrder);
router.route("/search/:searchText").post(searchRestaurant);
router.route("/:id").get(getSingleRestaurant);

export default router;
