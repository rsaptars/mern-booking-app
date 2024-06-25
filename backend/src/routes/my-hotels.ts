import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel, { HotelType } from "../models/hotels";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// api/my-hotels
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("adultCount")
      .notEmpty()
      .isNumeric()
      .withMessage("Adult Count is required and must be a number"),
    body("childCount")
      .notEmpty()
      .isNumeric()
      .withMessage("Child count is required and must be a number"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  upload.array("imageFiles", 6), // form field imageFiles is an array of 6 =< images
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;

      // 1. Upload images to cloudinary:
      const imageUrls = await uploadImages(imageFiles);

      // 2. Save image urls to new hotel object:
      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId;

      // 3. Save new hotel to database:
      const hotel = new Hotel(newHotel);
      await hotel.save();

      // 4. Return success status code:
      res.status(201).send(hotel);
    } catch (error) {
      console.log("Error creating hotel: ", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    const hotel = await Hotel.findById({
      _id: id,
      userId: req.userId,
    });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotel" });
  }
});

router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();

      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.hotelId,
          userId: req.userId,
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      hotel.imageUrls = [
        ...updatedImageUrls,
        ...(updatedHotel.imageUrls || []),
      ];

      await hotel.save();
      res.status(201).json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);
export default router;
async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64"); // convert image to base 64 string
    let dataURI = "data:" + image.mimetype + ";base64," + b64; // create URL to upload the image to cloudinary
    const res = await cloudinary.v2.uploader.upload(dataURI); // upload the image to cloudinary
    return res.url; // return URL from cloudinary
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}
