import { User } from "../models/user.models.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import OTP from "../models/otp.models.js";
import sendOtpMail from "../utils/sendEmail.js";
import { ApiKey } from "../models/apikey.models.js";
import sendAPIOtpMail from "../utils/sendAPIOtpEmail.js";
import jwt from "jsonwebtoken"


const genrateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const iser = await User.findById(userId);
        const accessToken = iser.genrateAccessToken();
        const refreshToken = iser.genrateRefreshToken();
        iser.refreshToken = refreshToken;
        iser.save({ validateBeforeSave: false }); 
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(420, "You are not authorised");
    }
};
const genrateAccessTokenForOtp = async(id)=>{
    try {
        const OTp = await OTP.findById(id);
        console.log(OTp)
        if (!OTp)
            throw new ApiError(404,"invalid user , you are not registered with us.")
       console.log("server hu mae ")  
       const verifyToken = OTp.generateAccessToken()
       console.log("Raja raam janki rani ")  
       console.log("verifytoken",verifyToken)
       return verifyToken ; 

    } catch (error) {
        throw new ApiError(420, "You are not registered with us , please register with us .");
    }
}

const genrateOtp = function(){
    const characters = '0123456789' ; 
    let result = '';

    for (let i = 0; i < 6 ; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result ; 
}

const genrateAPIkey = function(length){
    const characters = '0123456789' ; 
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result ; 

}

const genrateAPIkeySecret = function (length){
    const  characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|[]\\;\',./';
    let result = '';
    
    for (let i = 0; i < length; i++) {
       const randomIndex = Math.floor(Math.random() * characters.length);
       result += characters.charAt(randomIndex);
     }
   
     return result;
};

const signUp = asyncHandler(async(req,res)=>{
    try {
        const {fullname, email , username , password } = req.body
        if (
            [fullname , username , password , email ].some((field) => field?.trim()=== "")
            ) {
                throw new ApiError(400,"ALL feild are required")
            }
        const existeduser = await User.findOne({
            $or: [{username},{email}]
            })
        if(existeduser){
                throw new ApiError(409,"user exsist")
            }
        const newUser = await User.create({
            fullname,
            email,
            username,
            password
        })
        console.log(newUser)
        return res.status(200).json(
            new ApiResponse (200,"User registered, please verify  ")
        )


    } catch (error) {
        console.log(error.message)
        throw new ApiError(400,`${error.message}`)
    }
})

const logIn = asyncHandler(async(req,res)=>{
    try {
        const {email , password} = req.body
        console.log(req.body)
        if (email.trim() === "" || password.trim() === "") {
            throw new ApiError(400,"All feild are required")
            }
            console.log("1")
        const user = await User.findOne({email})
        console.log("2")
        if(!user){
            throw new ApiError(400,"User not found")
            }
            console.log("3")
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!(isPasswordValid)){
            throw new ApiError(405, "invalid credential")
            }
            console.log("3")
        const {accessToken, refreshToken} = await genrateAccessTokenAndRefreshToken(user._id)
        console.log("4")    
        const loggedUser = await User.findById(user._id).select("-password -refreshToken")
        console.log(loggedUser)
        const options = {
            httpOnly : true ,
            secure : true
        }
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
              200, 
              {
                  loggedUser : loggedUser,
                  accessToken : accessToken,
                  refreshToken : refreshToken
              },
              "User logged In Successfully"
          )
      )
    } catch (error) {
        console.log(error.message)
        throw new ApiError(400,`${error.message}`) 
    }
})

const logOut = asyncHandler(async(req,res)=>{
    try {
        await User.findByIdAndUpdate(
            req.theUser._id,
            {
                $unset:{
                    refreshToken : 1
                }
            }, 
                {
                    new : true
                }
         )
         const options = {
            httpOnly: true,
            secure: true
        }
     
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Admin logged Out"))
    } catch (error) {
        console.log(error.message)
        throw new ApiError(400,`${error.message}`) 
    }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            User : req.theUser
        },
        "User Details Fetched Succesfully"
    ))
})

const changePassword = asyncHandler(async(req,res)=>{
    try {
      const {oldPassword, newPassword} = req.body
      const user = await User.findById(req.theUser._id)
      const isValid = user.isPasswordCorrect(oldPassword)
      if(!isValid){
         throw new ApiError(400, "Old Password is Incorrect")
         }
         User.password = newPassword
         await User.save({validateBeforeSave: false})
         return res.status(200)
         .json( new ApiResponse(
             200,
             {},
             "password changed succesfully"
         ))
     } 
    catch (error) {
     throw new ApiError(400,`${error.message}`)
    }
 
 })

const sendOtp = asyncHandler(async(req,res)=>{
    try {
        const emailid = req.theUser.email
        console.log(req.theUser.email);
        console.log(emailid)
        if(!emailid){
            throw new ApiError(400,"you are not authorized")
        }
        const success = await User.findOne({email:emailid})
        if(!success){
            console.log("semi")
            throw new ApiError(400,"you are not semi authorized")
        }
        console.log("1")
        const fullname = success.fullname
        const otp = genrateOtp()
        const theOTP = await OTP.create({
            email:emailid,
            otp
        })
        console.log(theOTP);
        const otpId = theOTP.id
        await sendOtpMail(emailid,fullname,otp)
        const verifyToken = await genrateAccessTokenForOtp(otpId)
        console.log("janki",verifyToken)
        console.log("jaanki raani")
        const options = {
            httpOnly : true ,
            secure : true
        }
        return res.status(201)
        .cookie("verifyToken", verifyToken, options)
        .json(
            new ApiResponse(200,{
                token : verifyToken
            },"Email validated as Registered User and OTP sent sucessfully.")
        )
    } catch (error) {
        throw new ApiError(400,`${error.message}`)
    }
})

const validatedOtp = asyncHandler(async(req,res)=>{
    const {otp} = req.body
    console.log(otp)
    const token = req.cookies?.verifyToken || req.header("Authorization")?.replace("Bearer ","")
    console.log("token",token)
    if(!token){
        throw new ApiError(400,"Unauthorised request")
    }
    const decodedToken = jwt.verify(token, process.env.VERIFY_ACCESS_TOKEN_SECRET)
    console.log("decoded token",decodedToken)
    const theOtp = decodedToken.otp
    const theEmail = decodedToken.email
     if(theOtp==otp){
        console.log("verified")
        const success = await User.findOne({email:theEmail})
        console.log(success)
        if(!success){
            throw new ApiError(400,"you are not authorized")
        }
        success.isVerified = true;
        await success.save()
     }
     else{
        throw new ApiError(400,"Invalid OTP")
     }
     const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("verifyToken", options)
    .json(
        new ApiResponse(200,{
            tokeny:decodedToken
        },"otp verified and the account is activated.")
    )
})

const handleAPIrequest = asyncHandler(async(req,res)=>{
    try {
        console.log("API request came")
        const emailid = req.theUser.email
        console.log(emailid);
        if(!emailid){
            throw new ApiError(200,"you are not authorized")
        }
        console.log("ryka")
        const success = await User.findOne({email:emailid})
        console.log(success)
        if(!success){
            console.log("semi")
            throw new ApiError(400,"you are not semi authorized")
        }
        const fullname = success.fullname
        const otp = genrateOtp()
        const theOTP = await OTP.create({
            email:emailid,
            otp
        })
        console.log(theOTP);
        const otpId = theOTP.id
        await sendAPIOtpMail(emailid,fullname,otp)
        const verifyToken = await genrateAccessTokenForOtp(otpId)
        console.log("janki",verifyToken)
        console.log("jaanki raani")
        const options = {
            httpOnly : true ,
            secure : true
        }
        return res.status(201)
        .cookie("verifyToken", verifyToken, options)
        .json(
            new ApiResponse(200,{
                token : verifyToken
            },"Email validated as Registered User and OTP sent sucessfully.")
        )
        
    } catch (error) {
        throw new ApiError(400,`${error.message}`)
    }
})

const generateAPICredentials = asyncHandler(async(req,res)=>{
    try {
        const {otp}=req.body
        console.log(otp)
        const token = req.cookies?.verifyToken || req.header("Authorization")?.replace("Bearer ","")
        console.log("token",token)
        if(!token){
            throw new ApiError(400,"Unauthorised request")
        }
        const decodedToken = jwt.verify(token, process.env.VERIFY_ACCESS_TOKEN_SECRET)
        console.log("decoded token",decodedToken)
        const theOtp = decodedToken.otp
        const theEmail = decodedToken.email
        if(theOtp==otp){
            console.log("verified")
        const userId = req.theUser._id
        console.log(userId)
        const theUser = await User.findById(userId)
        if(!theUser){
            throw new ApiError(400,"you are not a valid user")
        }
        const APIkey = genrateAPIkey(32)
        const APISecret = genrateAPIkeySecret(256)
        console.log(APIkey,APISecret)

        const everDone = await ApiKey.findOne({holder:userId})
        if(!everDone){
            const credentials = await ApiKey.create({
                holder:userId,
                apikey:APIkey,
                apiKeySecret:APISecret  
            })
        }else{
            everDone.apikey = APIkey,
            everDone.apiKeySecret = APISecret,
            everDone.isCopied = false
            await everDone.save()
        }
        }
        const options = {
            httpOnly : true ,
            secure : true
        }
        return res.status(200)
        .clearCookie("verifyToken", options)
        .json(
        new ApiResponse(200,
            {},
            "otp verified and API crednetials genrated succesfully")
    )
    } catch (error) {
        console.log(error)
        throw new ApiError(400,`${error.message}`)
        
    }
})
const getcredentials = asyncHandler(async(req,res)=>{
    try {
        console.log("sending api keys")
        const {userId} = req.theUser._id
        const apikey = await ApiKey.findOne({holder:userId})
        console.log(apikey)
        return res.status(200)
        .json(
        new ApiResponse(200,
            {apikey},
            "Api key sent succesfully")
    )

    } catch (error) {
        
    }
})






export {
    signUp,
    logIn,
    logOut,
    getCurrentUser,
    changePassword,
    sendOtp,
    validatedOtp,
    handleAPIrequest,
    generateAPICredentials,
    getcredentials

}