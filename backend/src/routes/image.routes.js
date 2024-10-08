import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import uploadViaImaginary from "../controllers/image.controllers.js";
import { authVerify } from "../middlewares/auth.middlewares.js";


const router = Router();

router.route("/upload_g_image").post(upload.single('image'),authVerify,uploadViaImaginary)

export default router
