import mongoose,{Schema} from "mongoose"


const imageSchema = new Schema({
    imageUrl: {
        type: String,
        required: true,
        // This is the URL that points to the image in GCP bucket that https://storage.googleapis.com/alpha_men/{image}
      },
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model to associate uploads with users
        required: true,
      },
      //will add apikey thing in this too in next version
      fileName: {
        type: String,
        required: true,
        // Original filename from the user, e.g., "sunset.jpg"
      },
      fileType: {
        type: String,
        required: true,
        // e.g., "image/jpeg" or "image/png"
      },
      fileSize: {
        type: Number,
        required: true,
        // Store the file size in bytes, e.g., 204800 for a 200KB file
      },
      width: {
        type: Number,
        // Image width in pixels (optional, useful for galleries or previews)
      },
      height: {
        type: Number,
        // Image height in pixels
      },
      metadata :{
        type :Object,
        required : true
      },
      isPublic: {
        type: Boolean,
        default: true,
        // Whether the image is publicly accessible or private (controlled via API keys)
      }
},{
    timestamps:true,
    timeseries:true
})

export const image = mongoose.model("image",imageSchema)