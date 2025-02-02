import { Restaurant } from "../models/restaurant.model.js";
import { Menu } from "../models/menu.model.js";
import uploadImageOnCloudinary from "../utils/imageUpload.js";
import mongoose from "mongoose";

//MARK:addMenu
export const addMenu = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const file = req.file;
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
    if (restaurant) {
      restaurant.menus.push(menu._id);
      await Restaurant.save();
    }
    return res.status(201).json({
      success: true,
      message: "Menu added successfully",
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
        message: "menu not found",
      });
    }
    if (name) menu.name = name;
    if (description) menu.description = description;
    if (price) menu.price = price;

    if (file) {
      const imageUrl = await uploadImageOnCloudinary(file);
      menu.image = imageUrl;
    }
    await Menu.save();
    return res.status(200).json({
      success: true,
      message: "menu updated",
      menu,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Internal server error",
    });
  }
};

//MARK:deleteMenu
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Menu.deleteOne(id);

    return res.status(200).json({
      success: true,
      message: "menu updated",
      menu,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Internal server error",
    });
  }
};
