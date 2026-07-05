import { json } from "express"

const asyncHandler = (requestHandler)=>{
    
}






export {asyncHandler}

// const asyncHandler = (fn)=> async (req,res,next)=>{
//     try {
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success : false,
//             Message : err.message
//         })
//     }
// }