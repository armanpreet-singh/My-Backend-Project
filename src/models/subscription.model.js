import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema ({
    subscriber: {
        type : Schema.Types.ObjectId,    // The One Who Is Subscribing.
        ref : "User"
    },
    channel: {
          type : Schema.Types.ObjectId,    // The One To Whom 'Subscriber' is Subscribing.
        ref : "User"   
    }
},{timestamps : true})