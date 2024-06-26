import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request:Request){
    await dbConnect()

    try{
        const {username, email, password} =  await request.json();
        const existingUserVerified = await UserModel.findOne({username, isVerified: true});
        if(existingUserVerified){
            return Response.json(
                {
                    success: false,
                    message: "Username already exists"
                },
                {
                    status: 400
                }
            )
        }
        const existingUserEmail = await UserModel.findOne({email});
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
        if(existingUserEmail){
           if(existingUserEmail.isVerified){
            return Response.json(
                {
                  success: false,
                  message: 'User already exists with this email',
                },
                { status: 400 }
              );
           }
           else {
            const hashedPassword = await bcrypt.hash(password, 10);
            existingUserEmail.password = hashedPassword;
            existingUserEmail.verifyCode = verifyCode;
            existingUserEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
            await existingUserEmail.save();
          }
        }
        else{
           const hashedPassword = await bcrypt.hash(password, 10);
           const expiryDate = new Date();
           expiryDate.setHours(expiryDate.getHours() + 1)

           await UserModel.create({
            username,
            email,
            password: hashedPassword,
            verifyCode,
            verifyCodeExpiry: expiryDate,
            isVerified: false,
            isAcceptingMessage: false,
            messages: [],
           })
        }

        // send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode)
        if(!emailResponse.success) {
            return Response.json({
                    success: false,
                    message: emailResponse.message
            }, {status: 500})
        }
        return Response.json({
            success: true,
            message: "User registered successfully. Please verify your email"
        }, {status: 201})
    }
    catch(error){
        console.error('Error registering user', error)
        return Response.json(
            {
                success: false,
                message: "Error registering user"
            },
            {
                status: 500
            }
        )
    }
}