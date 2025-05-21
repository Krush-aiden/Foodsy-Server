import cloudinary from "./cloudinary.js";

const uploadImageOnCloudinary = async (file) => {
  const filePath = file?.path;
  let cloudinaryRes = null;
  let secureUrl = undefined;

  try {
    cloudinaryRes = await cloudinary.uploader.upload(filePath, {
      quality: "auto",
      fetch_format: "auto",
      resource_type: "auto",
    });
    secureUrl = cloudinaryRes.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    // Optionally handle upload failure
  }

  return secureUrl;
};

export default uploadImageOnCloudinary;
