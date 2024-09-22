import { Router } from "express";
import { authVerify } from "../middlewares/auth.middlewares.js";
import { generateAPICredentials, getcredentials, handleAPIrequest, sendOtp, validatedOtp } from "../controllers/user.controllers.js";

const router = Router()

router.route("/sentotp").post(authVerify,sendOtp)
router.route("/validatedOtp").post(authVerify,validatedOtp)
router.route("/handleAPIrequest").post(authVerify,handleAPIrequest)
router.route("/generateAPICredentials").post(authVerify,generateAPICredentials)
router.route("/getcredentials").get(authVerify,getcredentials)

export default router

