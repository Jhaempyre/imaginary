import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import uploadImage from "../controllers/image.controllers.js";

const router = Router();

router.route("/upload_g_image").post(upload.single('image'),uploadImage)

export default router
