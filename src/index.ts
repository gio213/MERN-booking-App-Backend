import express, { Request, Response } from 'express';
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
import userRoutes from "./routes/users"
import authRoutes from "./routes/auth"
import cookieParser from "cookie-parser"
import { v2 as cloudinary } from "cloudinary"
import myHotelRoutes from "./routes/my-hotels"
import path from 'path';



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string).then(() => {
    console.log("Connected to MongoDB")
}).catch((eroor) => {
    console.log("Error connecting to MongoDB", eroor)
})



const app = express()
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))

app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "Health OK!" });
});

app.use("/api/users/", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/my-hotels", myHotelRoutes)


// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})