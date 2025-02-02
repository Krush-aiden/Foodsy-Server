import jwt from "jsonwebtoken";

//MARK:isAuthenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    //verify the token
    if (!process.env.JWT_SECRET_KEY || process.env.JWT_SECRET_KEY === "") {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET_KEY is not defined or is empty",
      });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decode) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    req.id = decode.userId;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
