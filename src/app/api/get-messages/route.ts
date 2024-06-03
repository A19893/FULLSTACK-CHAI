import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { User } from 'next-auth'
import mongoose from 'mongoose';

export async function GET(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions)
    const user: User = session?.user
    if (!session || !session?.user) {
        return Response.json({
            success: false,
            message: "User is not authenticated"
        },
            { status: 401 }
        )
    }

    const userId = new mongoose.Types.ObjectId(user._id)
    try{
        const is_user_exists = await UserModel.findById(userId);
        if(!is_user_exists){
            return Response.json({
                success: false,
                message: "User not found"
            },
                { status: 404 }
            )
        }
        const user = await UserModel.aggregate([
            { $match: {_id: userId}},
            { $unwind: '$messages'},
            { $sort: {'messages.createdAt': -1}},
            {$group: {_id: '$_id', messages: {$push: '$messages'}}}
        ]).exec();
        
        if(user.length == 0){
            return Response.json({
                success: false,
                message: "No messages present yet"
            },
                { status: 200 }
            )
        }
        return Response.json({
            success: true,
            message: "Fetched Latest messages",
            messages: user[0].messages
        },
            { status: 200 }
        )
    }
    catch(error){
        console.error('An unexpected error occurred:', error);
        return Response.json(
          { message: 'Internal server error', success: false },
          { status: 500 }
        );
    }
}