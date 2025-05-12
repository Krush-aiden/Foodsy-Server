import cloudinary from "./cloudinary.js";

const uploadImageOnCloudinary = async (file) => {
  const filePath = file?.path;

  const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
    quality: "auto",
    fetch_format: "auto",
    resource_type: "auto",
  });

  return cloudinaryRes.url ? cloudinaryRes.url : cloudinaryRes;
};

export default uploadImageOnCloudinary;
