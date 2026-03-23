import { Restaurant } from "../models/restaurant.model.js";
import { Menu } from "../models/menu.model.js";
import uploadImageOnCloudinary from "../utils/imageUpload.js";

//MARK:getMenus
export const getRestaurantMenus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.id }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // fallback safety
    const menuIds = restaurant.menus || [];

    const menus = await Menu.find({
      _id: { $in: menuIds },
    })
      .sort({ createdAt: -1 }) // ✅ latest first
      .lean(); // ✅ performance boost

    return res.status(200).json({
      success: true,
      count: menus.length, // ✅ useful for UI
      menus,
    });
  } catch (error) {
    console.error("getRestaurantMenus error:", error);

    return res.status(500).json({
      success: false, // ✅ consistent
      message: "Internal server error",
    });
  }
};


//MARK:addMenu
export const addMenu = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const file = req.file;

    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imageUrl = await uploadImageOnCloudinary(file);

    const menu = await Menu.create({
      name,
      description,
      price,
      imageUrl,
    });

    const restaurant = await Restaurant.findOne({ user: req.id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.menus.push(menu._id);
    await restaurant.save();

    return res.status(201).json({
      success: true,
      message: "Menu added successfully",
      menu,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


//MARK:editMenu
export const editMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const file = req.file;

    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    if (name) menu.name = name;
    if (description) menu.description = description;
    if (price) menu.price = price;

    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file);
      menu.imageUrl = imageUrl; // ✅ consistent field
    }

    await menu.save(); // ✅ fixed

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      menu,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


//MARK:deleteMenu
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    // 1️⃣ Delete menu
    await Menu.findByIdAndDelete(id);

    // 2️⃣ Remove reference from restaurant
    const restaurant = await Restaurant.findOne({ user: req.id });

    if (restaurant) {
      restaurant.menus = restaurant.menus.filter(
        (menuId) => menuId.toString() !== id
      );
      await restaurant.save();
    }

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};