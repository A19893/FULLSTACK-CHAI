import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { Message } from '@/model/Message';

export async function POST(request: Request){
    await dbConnect();

    const { username , content } = await request.json()
    try{
        const user =  await UserModel.findOne({username})

        if(!user){
            return Response.json({
                success: false,
                message: "User not found"
            },
                { status: 404 }
            )
        }

        if(!user.isAcceptingMessage){
            return Response.json({
                success: false,
                message: "User is not accepting the messages"
            },
                { status: 403 }
            )
        }

        const new_message = {content, createdAt:new Date()}
        user.messages.push(new_message as Message)
        await user.save();
        return Response.json({
            success: true,
            message: "Message Sent Successfully"
        },
            { status: 201 }
        )
    }
    catch(error){
        console.log("Failed to send message")
        return Response.json(
            {
                success: false,
                message: "Error in sending message"
            },
            { status: 500 }
        )
    }
}