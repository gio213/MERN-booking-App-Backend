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

        const imageUrls = await uploadImages(imageFiles)
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

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
    const id = req.params.id.toString()
    try {

        const hotel = await Hotel.findOne({
            _id: id,
            userId: req.userId
        })

        res.json(hotel)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching hotels" })
    }
})

router.put("/:hotelId", verifyToken, upload.array("imageFiles"), async (req: Request, res: Response) => {
    try {
        const updatedHotel: HotelType = req.body
        updatedHotel.lastUpdated = new Date()
        const hotel = await Hotel.findByIdAndUpdate({
            _id: req.params.hotelId,
            userId: req.userId
        }, updatedHotel, { new: true })
        if (!hotel) {
            return res.status(404).json({ messsage: "Hotel not found" })
        }
        const files = req.files as Express.Multer.File[];
        const updatedImagesUrls = await uploadImages(files)
        hotel.imageUrls = [...updatedImagesUrls, ...(updatedHotel.imageUrls || [])]
        await hotel.save()
        res.status(201).json(hotel)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong" })
    }
})




async function uploadImages(imageFiles: Express.Multer.File[]) {
    const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64")
        let dataURI = "data:" + image.mimetype + ";base64," + b64
        const res = await cloudinary.v2.uploader.upload(dataURI, { folder: "hotels_images" })

        return res.url
    })

    const imageUrls = await Promise.all(uploadPromises)
    return imageUrls
}


export default router