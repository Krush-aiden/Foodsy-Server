import jwt from "jsonwebtoken";

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

  res.cookie("token", token, {
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "none", // Allow cross-site cookies
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
};
