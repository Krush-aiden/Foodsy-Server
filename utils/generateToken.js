import jwt from "jsonwebtoken";

const environment = process.env.ENVIRONMENT;

export const getTokenCookieOptions = (withExpiry = true) => {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  if (withExpiry) {
    cookieOptions.maxAge = 24 * 60 * 60 * 1000;
  }

  if (environment !== "prod") {
    cookieOptions.domain = "localhost";
  }

  return cookieOptions;
};

export const generateToken = (req, res, user) => {
  if (
    process.env.JWT_SECRET_KEY == "" ||
    process.env.JWT_SECRET_KEY == undefined
  ) {
    return res.status(500).json({
      success: false,
      message: "JWT_SECRET_KEY is not defined or is empty",
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res.cookie("token", token, getTokenCookieOptions());
  return token;
};
