// require('dotenv').config({path : './env'})
import dns from "node:dns";


dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`⚙️  Server Is Running At Port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDB Connection Failed : ",err);
})



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