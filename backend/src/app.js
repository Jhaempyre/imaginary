import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
// to permit the cross origin  , will remove while going in production
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
// to parse the incoming requests with JSON payloads (from req.body)
app.use(express.json({
    limit:"10Mb"
}))
// To handle cookies 
app.use(cookieParser())

// to get the url encoding

app.use(express.urlencoded({
    extended:true,
    limit:"16Mb"
}))

app.use(express.static("public"))//public asset hae jaha 


import userRouter from "./routes/user.routes.js"
app.use("/api/v1/user",userRouter)

export {app}