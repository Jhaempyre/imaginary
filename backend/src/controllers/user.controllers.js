import { User } from "../models/user.models";
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

const signUp = asyncHandler(async(req,res)=>{
    try {
        const {fullname, email , username , password } = req.body
        if (
            [fullname , username , password , email , bio].some((field) => field?.trim()=== "")
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


export {
    signUp,
    logIn,
    logOut,
    getCurrentUser,
    changePassword
}