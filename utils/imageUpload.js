import cloudinary from "./cloudinary.js";

const uploadImageOnCloudinary = async (file) => {
  const base64Image = Buffer.from(file.Buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${base64Image}`;
  const uploadResponse = await cloudinary.uploader.upload(dataURI);
  return uploadResponse.secure_url;
};

export default uploadImageOnCloudinary;
