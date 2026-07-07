import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/users.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiRespone } from "../utils/ApiResponse.js"
import { useEffect } from "react"


const registerUser = asyncHandler(async (req,res)=>{
// Get User Details From Frontend.
// Validation Checks - Not Empty
// Check If User Already Exists - Username, Email.
// Check For Images And Avatars,
// Upload Them To Cloudinary.
// Create User Object - Create Entry In DB.
// Remove Password And Refresh Token Field From Response.
// Check For USer Creation.
// Return res.

const{fullName, email, username, password}=req.body
console.log("email : ",email );

if([fullName, email, username, password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"All Fields Are Required")
}

const existedUser = User.findOne({
    $or : [{username},{email    }]
})

if(existedUser){
    throw new ApiError(409,"User With email or username already exists")
}


})

export {registerUser}