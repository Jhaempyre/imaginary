import { Router } from "express";
import { authVerify } from "../middlewares/auth.middlewares";
import { generateAPICredentials, handleAPIrequest, sendOtp, validatedOtp } from "../controllers/user.controllers";

const router = Router()

router.route("/sentotp").post(authVerify,sendOtp)
router.route("/validatedOtp").post(authVerify,validatedOtp)
router.route("/handleAPIrequest").post(authVerify,handleAPIrequest)
router.route("/generateAPICredentials").post(authVerify,generateAPICredentials)

export default router

