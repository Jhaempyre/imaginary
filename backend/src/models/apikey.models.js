import mongoose,{Schema} from "mongoose";

const apiKeySchema = new Schema(
    {
        holder:{
            type:Schema.Types.ObjectId,
            ref : "User"
        },
        apikey:{
            type:String,
            required:true
        },
        apiKeySecret:{
            type:String,
            required:true
        },
        isCopied :{
            type:Boolean,
            default:false
        }
    
},{
    timeseries:true,
    timestamps:true
})

export const ApiKey = mongoose.model("ApiKey",apiKeySchema) 
