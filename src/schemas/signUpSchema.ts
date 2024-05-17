import { z } from 'zod';

export const usernameValidation = z.
    string()
    .min(2, "Username must be atleast 2 chatacters")
    .max(20, "Username must be no more than 20 chatacters")
    .regex(/^[a-zA-Z0-9_]+$/,"Username must not contain special characters")


export const signupSchema = z.object({
    username: usernameValidation,
    email: z.string().email({message:"Please Enter Valid Email Address"}),
    password: z.string().min(6, {message: "Password must be atleast 6 characters"})
})