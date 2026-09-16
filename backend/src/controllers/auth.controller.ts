import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function publicUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "BORROWER"
  });

  const token = signToken({ sub: String(user._id), role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() });

  if (!user || !(await user.comparePassword(input.password))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = signToken({ sub: String(user._id), role: user.role });
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id).select("_id name email role");
  if (!user) {
    throw new HttpError(404, "User not found.");
  }
  res.json({ user: publicUser(user) });
});
