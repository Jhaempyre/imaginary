import { ApiError } from "./ApiError.js";
import nodemailer from "nodemailer"


const sendOtpMail = async(email,otp,fullname)=>{
    try {
        const transport = nodemailer.createTransport({
            host: "live.smtp.mailtrap.io",
            port: 587,
            auth: {
              user: process.env.EMAILUSER ,
              pass: process.env.EMAILPASSWORD
            }
          });
        const mailOptions = {
            from: " noreply@demomailtrap.com",
            to: email,
            subject: "Welcome to Imaginary",
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Imaginary!</title>
            </head>
            <body>
            
            <div class="container">
              <h1>We are thrilled to have you on board.</h1>
              <p>Hi ${fullname},</p>
              <p>Confirm Your email is : ${email}</p>
              <p>To keep you safe form any unauthorized access , pleaseverify yourself.
              Your OTP is: ${otp}</p>
              <p>Enter this OTP to activate your account.</p>
              <p>Please report to us immediately on our email if the sign Up request is not initiated by you.
              <br>
               we value your privacy and our family data's integrity at top.
              </p>
              <p>please help us in maintaiing a strong bond.
              </p>
              <p>Best regards,</p>
              <p>Aashish Jha<br>
              CEO<br>
              Imaginary<br>
              Jhaempire.com</p>
            </div>
            
            </body>
            </html>
            `
        }
        const mailresponse = await transport.sendMail
        (mailOptions);
        console.log("otp message sent")
        return mailresponse;      
        
    } catch (error) {
      console.log(error.message)
      throw new ApiError (500,{
        error: "Couldn,t request otp , Please try again later internal server error"})
    }
}

export default sendOtpMail