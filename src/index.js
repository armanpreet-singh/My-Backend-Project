// require('dotenv').config({path : './env'})
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/index.js";

connectDB();



/*import express from "express";
const App = express()
;( async ()=>{
try {
    await mongoose.connect(`${process.env.MONGODB_URI}/
        ${DB_NAME}`)
        application.on("error",(error)=>{
console.log("ERROR : ",error);
throw error;

        })
        application.listen(process.env.PORT, ()=>{
            console.log(`App Is Listening On Port : ${process.env,PORT}`);
            
        })
} catch (error) {
    console.error("ERROR : ",error);
    
}
})()*/