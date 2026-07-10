import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespone } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { MongoAPIError } from "mongodb";
import { Mongoose } from "mongoose";


const generateAccessAndRefreshTokens = async(userId)=>
{
     try {
     const user = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
    
     user.refreshToken = refreshToken
     await user.save({validateBeforesave : false})

     return {accessToken,refreshToken}

    } catch (error) {

        throw new ApiError(500,"Something Went Wrong While Generating Tokens.")

    }
}






const registerUser = asyncHandler(async (req, res) => {
  // Get User Details From Frontend.
  // Validation Checks - Not Empty
  // Check If User Already Exists - Username, Email.
  // Check For Images And Avatars,
  // Upload Them To Cloudinary.
  // Create User Object - Create Entry In DB.
  // Remove Password And Refresh Token Field From Response.
  // Check For USer Creation.
  // Return res.

  const { fullName, email, username, password } = req.body;
  // console.log("email : ",email );

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User With email or username already exists");
  }

  const avatarlocalPath = req.files?.avatar[0]?.path;
  // const coverImagelocalPath = req.files?.coverImage[0]?.path

  let coverImagelocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0].path;
  }

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar File Is Required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath);
  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File Is Required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-passowrd -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Registring The User");
  }

  return res
    .status(201)
    .json(new ApiRespone(200, createdUser, "✅  User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Req Body --> Data.
  // Username Or Email.
  // Find The User.
  // Password Check.
  // Access And Refresh Token.
  // Send Cookie.

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username Or Password Required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User Doesn't Exist.");
  }

const isPasswordValid = await user.isPasswordCorrect(password)

if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials.");
  }

const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).
select("-password -refreshToken")

const options = {
    httpOnly : true,
    secure : true
}

return res
.status(200)   
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiRespone(
        200,
        {
            user : loggedInUser, accessToken, refreshToken
        },
        "💹  User Logged In Successfully."
    )
)


});

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
      req.user._id, 
      {
        $set : {
          refreshToken : undefined
        }
      },
      {
        new : true
      }
    )
const options = {
    httpOnly : true,
    secure : true
}
return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiRespone(200, {}, "User Logged Out Successfully." ))



})

const refreshAccessToken = asyncHandler(async(req, res)=>{
  const incomingRefreshToken = req.cookies.
  refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorised Request!")
  }
  
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
    )
  
  const user = await User.findById(decodedToken?._id)
  
  if(!user){
    throw new ApiError(401, "Invalid Refresh Token!")
  }
  
  if(incomingRefreshToken !== user?.refreshToken){
  throw new ApiError(401, "Refresh Token Is Expired Or Used")
  }
  
  const options = {
    httpOnly : true,
    secure : true
  }
  const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)
  
  return res
  .status(200)   
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
      new ApiRespone(
          200,
          {accessToken, refreshToken : newrefreshToken},
          "🔁  Access Token Refreshed"
      )
  )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
  const {oldPassword, newPassword} = req.body

const user = await User.findById(req.user?.id)
const isPasswordCorrect = await user.
isPasswordCorrect(oldPassword)

if(!isPasswordCorrect){
  throw new ApiError(400, "Old Password Incorrect")
}

user.password = newPassword
await user.save({validateBeforesave : false})

return res
.status(200)
.json(new ApiRespone(200, {}, "Password Changes Successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
return res
.status(200)
.json(200, req.user, "Current User Fetched Successfully")
})

const updateAcountDetails = asyncHandler(async(req, res)=>{

if(!fullName || !email){
  throw new ApiError(400, "All Fields Are Required!")
}

const user = User.findByIdAndDelete(
  req.user?._id,
  {
$set : {
  fullName,
  email: email
}
  },
  { new : true }

).select("-password")

return res
.status(200)
.json(new ApiRespone(200, user, "Account Details Updated Successfully."))

})

const updateUserAvatar = asyncHandler(async(req, res)=>{

const avatarlocalPath = req.file?.path

if(!avatarlocalPath){
  throw new ApiError(400, "Avatar File Is Missing!")
}

const avatar = await uploadOnCloudinary(avatarlocalPath)

if(!avatar.url){
  throw new ApiError(400, "Error While Uploading Avatar")
}

const user = await User.findByIdAndUpdate( 
  req.user?._id,
  {
    $set : {
      avatar = avatar.url
    }
  },

  { new : true }
).select("password")

return res
.status(200)
.json(
  new ApiRespone(200, user, "Avatar Updated Successfully.")
)
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{

const coverImagelocalPath = req.file?.path

if(!coverImagelocalPath){
  throw new ApiError(400, "Cover Image File Is Missing!")
}

const coverImage = await uploadOnCloudinary(coverImagelocalPath)

if(!coverImage.url){
  throw new ApiError(400, "Error While Uploading Cover Image!")
}

const user = await User.findByIdAndUpdate( 
  req.user?._id,
  {
    $set : {
      coverImage = coverImage.url
    }
  },

  { new : true }
).select("password")

return res
.status(200)
.json(
  new ApiRespone(200, user, "Cover Image Updated Successfully.")
)
})

const getUserChannelProfile = asyncHandler(async(req, res)=>{

const {username} = req.params

if(!username.trim()){
  throw new ApiError(400, "Username Is Missing!")
}

const channel = await User.aggregate([
  {
    $match: {
      username : username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from : "subscriptions",
      localField : "_id",
      foreignField : "channel",
      as : "subscribers"
    }
  },
  {
      $lookup: {
      from : "subscriptions",
      localField : "_id",
      foreignField : "subscriber",
      as : "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribersCount: {
        $size : "$subscribers"
      },
      channelsSubscribedToCount: {
        $size : "$subscribedTo"
      },
      isSubscribed: {
        $cond : {
          if : { $in : [req.user?._id, "$subscribers.subscriber "]},
          then : true,
          else : false
        }
      }
    }
  },{
    $project: {
      fullName : 1,
      username : 1,
      subscribersCount : 1,
      channelsSubscribedToCount : 1,
      isSubscribed : 1,
      avatar : 1,
      coverImage : 1,
      email : 1
    }
  }
])

if(!channel?.length){
  throw new ApiError(404, "Channel Doesnot Exist!")
}

return res
.status(200)
.json(
  new ApiRespone(200, channel[0], "💹  User Channel Fetched Successfully.")
)

})

const getWatchHistory = asyncHandler(async(req, res)=>{
  const user = await User.aggregate([
    {
      $match: { 
        _id : new Mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        pipeline : [
          {
            $lookup: {
                   from : "users",
        localField : "owner",
        foreignField : "_id",
        as : "owner",
        pipeline : [
          {
            $project: {
              fullName : 1,
              username : 1,
              avatar : 1
            }
          }
        ]
            }
          },
          {
            $addFields: {
              owner : {
                $first : "$owner"
              }
            }
          }
        ]
      }
    }
  ])
})


export { registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   updateAcountDetails,
   updateUserAvatar,
   updateUserCoverImage
  };
