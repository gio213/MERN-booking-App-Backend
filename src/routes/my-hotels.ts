import express, { Response, Request } from "express"
import multer from "multer"
import cloudinary from "cloudinary"
import Hotel, { HotelType } from "../models/hotel"
import { verifyToken } from "../middleware/auth"
import { body } from "express-validator"

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 5 * 1024 * 1024 // 5mb
    },
})

// api/my-hotels
router.post("/", verifyToken, [
    body("name").notEmpty().withMessage("Hotel name is required"),
    body("ctiy").notEmpty().withMessage("City  is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("pricePerNight").notEmpty().isNumeric().withMessage("Price per night is required and must be a number"),
    body("facilities").notEmpty().isArray().withMessage("Facilities are required "),
], upload.array("imageFiles", 6), async (req: Request, res: Response) => {

    try {
        const imageFiles = req.files as Express.Multer.File[];
        const newHotel: HotelType = req.body;

        const uploadPromises = imageFiles.map(async (image) => {
            const b64 = Buffer.from(image.buffer).toString("base64")
            let dataURI = "data:" + image.mimetype + ";base64," + b64
            const res = await cloudinary.v2.uploader.upload(dataURI, { folder: "hotels_images" })

            return res.url;
        })

        const imageUrls = await Promise.all(uploadPromises)
        newHotel.imageUrls = imageUrls
        newHotel.lastUpdated = new Date()
        newHotel.userId = req.userId;

        const hotel = new Hotel(newHotel)

        await hotel.save()
        res.status(201).send(hotel)
    } catch (error) {
        console.log("Error creating hotel : ", error)
        res.status(500).json({ message: "Error creating hotel" })
    }


})

router.get("/", verifyToken, async (req: Request, res: Response) => {

    try {
        const hotels = await Hotel.find({ userId: req.userId })
        if (!hotels) {
            res.status(404).json({ message: "Hotels not found" })
        }
        res.json(hotels)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching hotels" })
    }
})


export default router