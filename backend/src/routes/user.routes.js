import { Router } from "express";
import { changePassword, getCurrentUser, logIn, logOut, signUp } from "../controllers/user.controllers.js";
import { authVerify } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/signup").post(signUp)
router.route("/login").post(logIn)
router.route("/logout").post(authVerify,logOut)
router.route("/getUser").get(authVerify,getCurrentUser)
router.route("/changePassword").post(authVerify,changePassword)

export default router