// import { Multer } from "multer";
import { Restaurant } from "../models/restaurant.model.js";
import uploadImageOnCloudinary from "../utils/imageUpload.js";
import { Order } from "../models/order.model.js";

//MARK:createRestaurant
export const createRestaurant = async (req, res) => {
  try {
    console.log(req.body);
    console.log("🚀 ~ createRestaurant ~ req.file:", req.file);
    const {
      restaurantName,
      restaurantCity: city, // Rename 'restaurantCity' to 'city'
      restaurantCountry: country, // Rename 'restaurantCountry' to 'country'
      restaurantEdt: deliveryTime, // Rename 'restaurantEdt' to 'deliveryTime'
    } = req.body;

    const restaurantCuisines = req.body.restaurantCuisines;
    const cuisines = restaurantCuisines.split(",").map((item) => item.trim());
    console.log("🚀 ~ createRestaurant ~ cuisines:", cuisines);

    const file = req.file;
    const restaurant = await Restaurant.findOne({ user: req.id });
    if (restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant  already exist for this user",
      });
    }
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }
    const imageUrl = await uploadImageOnCloudinary(file);
    console.log("🚀 ~ createRestaurant ~ imgURL:", imageUrl);

    await Restaurant.create({
      user: req.id,
      restaurantName,
      city,
      country,
      deliveryTime,
      cuisines,
      imageUrl,
    });
    return res.status(201).json({
      success: true,
      message: "Restaurant Added",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
  console.log("🚀 ~ createRestaurant ~ req.body:", req.body);
};
//MARK:getRestaurant
export const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.find({ user: req.id });
    if (!restaurant) {
      return res.status(500).json({
        message: "Restaurant not found",
      });
    }

    return res.status(200).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

//MARK:updateRestaurant
export const updateRestaurant = async (req, res) => {
  try {
    const { restaurantName, city, country, deliveryTime, cuisine } = req.body;

    const restaurant = await Restaurant.find({ user: req.id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }
    restaurant.restaurantName = restaurantName;
    restaurant.city = city;
    restaurant.country = country;
    restaurant.deliveryTime = deliveryTime;
    restaurant.cuisine = JSON.parse(cuisine);

    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file);
      restaurant.imageUrl = imageUrl;
    }
    await restaurant.save();
    return res.status(200).json({
      success: true,
      message: "Restaurant updated",
      restaurant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//MARK:getRestaurantOrder
export const getRestaurantOrder = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user");
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//MARK:updateOrderStatus
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    order.status = status;
    await Order.save();
    return res.status(201).json({
      success: true,
      message: "status updated",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//MARK:searchRestaurant
export const searchRestaurant = async (req, res) => {
  try {
    const searchText = req.params.searchText || "";
    const searchQuery = req.query.searchQuery || "";
    const selectedCuisines = (req.query.selectedCuisines || "")
      .split(",")
      .filter((cuisine) => cuisine);

    const query = {};
    //basic search based on searchText (name, city, country)
    if (searchText) {
      query.$or = [
        { restaurantName: { $regex: searchText, $option: "i" } },
        { city: { $regex: searchText, $option: "i" } },
        { country: { $regex: searchText, $option: "i" } },
      ];
    }
    //filter on the basis of searchQuery
    if (searchQuery) {
      query.$or = [
        { restaurantName: { $regex: searchText, $option: "i" } },
        { cuisine: { $regex: searchQuery, $option: "i" } },
      ];
    }
    // console.log(query);
    if (selectedCuisines.length > 0) {
      query.cuisine = { $in: selectedCuisines };
    }
    const restaurants = await Restaurant.find(query);
    return res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//MARK:getSingleRestaurant
export const getSingleRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await Restaurant.findById(restaurantId).populate({
      path: "menus",
      options: { created: -1 },
    });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }
    return res.status(200).json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};
