import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import userRout from "./routes/user.rout.js";
import restaurantRout from "./routes/restaurant.rout.js";
import menuRout from "./routes/menu.rout.js";

dotenv.config();

const app = express();

//default middleware for any MERN Project
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    credentials: true,
  })
);

// console.log("🚀 ~ process.env.PORT:", process.env.PORT);
const PORT = process.env.PORT || 3000;

//api

//MARK:User Api
app.use("/api/v1/user", userRout);
// https://localhost:8000/api/v1/user/signup

//MARK:Restaurant Api
app.use("/api/v1/restaurantRout", restaurantRout);
// https://localhost:8000/api/v1/restaurantRout

app.use("/api/v1/menuRout", menuRout);
// https://localhost:8000/api/v1/menuRout

app.get("/hello", (req, res) => {
  res.send("hello");
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listen at post ${PORT}`);
});
