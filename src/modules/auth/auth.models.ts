import { model, Schema } from "mongoose";
import { IUser } from "./auth.interface";

export const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export const User = model<IUser>("User", userSchema)
