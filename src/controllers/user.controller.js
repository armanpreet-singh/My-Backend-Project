import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespone } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


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

}
)

export { registerUser,
   loginUser,
   logoutUser };
