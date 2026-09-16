import bcrypt from "bcryptjs";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { roles, type Role } from "../types/roles.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true, default: "BORROWER" satisfies Role }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  comparePassword(password: string): Promise<boolean>;
};

export type UserModel = Model<UserDocument>;

export const User = mongoose.model<UserDocument, UserModel>("User", userSchema);
