import { User } from "../models/users.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req, res, next)=>{

const token = req.cookies?.accessToken || req.header
("Authorization")?.replace("Bearer ", "")

if(!token){
    throw new ApiError(401, "Unauthorized Access!")
}

const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

const user = await User.findById(decodedtoken?._id).select
("-password -refreshToken")

if(!user){
    throw new ApiError(401, "Invalid Access Token!")
}




})