// import { Multer } from "multer";
import { Restaurant } from "../models/restaurant.model.js";
import { Menu } from "../models/menu.model.js";
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
      isActive,
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
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
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
    const {
      restaurantName,
      restaurantCity: city,
      restaurantCountry: country,
      restaurantEdt: deliveryTime,
      restaurantCuisines: cuisine,
      isActive,
    } = req.body;
    console.log("🚀 ~ updateRestaurant ~ req.body:", req.body);

    const restaurant = await Restaurant.findOne({ user: req.id });
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
    restaurant.cuisines =
      typeof cuisine === "string"
        ? cuisine
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : cuisine;
    if (isActive !== undefined) {
      restaurant.isActive = isActive === "true" || isActive === true;
    }

    const file = req.file;
    console.log("🚀 ~ updateRestaurant ~ file:", file);

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

//MARK:createOrder
export const createOrder = async (req, res) => {
  try {
    const { restaurant, deliveryDetails, cartItems, totalAmount } = req.body;
    if (
      !restaurant ||
      !deliveryDetails ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const order = await Order.create({
      user: req.id,
      restaurant,
      deliveryDetails,
      cartItems,
      totalAmount: Number(totalAmount),
      status: "pending",
    });
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//MARK:getUserOrders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.id })
      .populate("restaurant")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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
    await order.save();
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
    //basic search based on searchText (name, city, country, cuisines)
    if (searchText) {
      // Also search menus by name/description to find restaurants with matching items
      const matchingMenus = await Menu.find({
        $or: [
          { name: { $regex: searchText, $options: "i" } },
          { description: { $regex: searchText, $options: "i" } },
        ],
      }).select("_id");
      const menuIds = matchingMenus.map((m) => m._id);

      query.$or = [
        { restaurantName: { $regex: searchText, $options: "i" } },
        { city: { $regex: searchText, $options: "i" } },
        { country: { $regex: searchText, $options: "i" } },
        { cuisines: { $regex: searchText, $options: "i" } },
      ];
      if (menuIds.length > 0) {
        query.$or.push({ menus: { $in: menuIds } });
      }
    }
    //filter on the basis of searchQuery
    if (searchQuery) {
      query.$or = [
        { restaurantName: { $regex: searchQuery, $options: "i" } },
        { cuisines: { $regex: searchQuery, $options: "i" } },
      ];
    }
    if (selectedCuisines.length > 0) {
      query.cuisines = { $in: selectedCuisines };
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
      options: { sort: { createdAt: -1 } },
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
