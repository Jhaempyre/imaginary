import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '10m' // OTP expires in 10 minutes
    }
});

otpSchema.methods.generateAccessToken = function()
{
    console.log("token genrasation")
    return jwt.sign({
        _id:this._id,
        email:this.email,
        otp:this.otp
    },
    process.env.VERIFY_ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.VERIFY_TOKEN_EXPIRY
    }
    )
    
}

const OTP = mongoose.model('OTP', otpSchema);



export default OTP;