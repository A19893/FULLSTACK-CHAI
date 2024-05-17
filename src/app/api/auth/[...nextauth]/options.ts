import { NextAuthOptions } from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export const authOptions:NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text "},
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials: any) : Promise<any>{
                // Add logic here to look up the user from the credentials supplied
                await dbConnect();
                try{
                    const user =  await UserModel.findOne({
                        $or: [
                            {email: credentials.identifier.email},
                            {password: credentials.identifier.password}
                        ]
                     })

                     if(!user) {
                        throw new Error('No user found with this email')
                     }

                     if(!user.isVerified) {
                        throw new Error('Please verify your account first before login!')
                     }

                     const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
                     if(isPasswordMatch){
                        return user;
                     }
                     else{
                        throw new Error('Incrorrect Email/Password')
                     }
                }
                catch(error : any){
                    throw new Error(error)
                }
                const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }
          
                if (user) {
                  // Any object returned will be saved in `user` property of the JWT
                  return user
                } else {
                  // If you return null then an error will be displayed advising the user to check their details.
                  return null
          
                  // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
                }
              }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if(token){
                session.user._id = token._id
                session.user.isVerified = token.isVerified
                session.user.isAcceptingMessages = token.isAcceptingMessages
                session.user.username = token.username
            }
            return session
        },
        async jwt({ token, user }) {
            if(user) {
                token._id = user._id?.toString()
                token.isVerified = user.isVerified
                token.isAcceptingMessages = user.isAcceptingMessages
                token.username = user.username
            }
            return token
        }
    },
    pages: {
        signIn: '/signin',
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET
}