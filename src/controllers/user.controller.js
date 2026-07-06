import {asyncHandler} from "../utils/asyncHandler.js"

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
})

export {registerUser}