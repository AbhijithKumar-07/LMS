import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { User } from "../models/user.model.js";
import type { Role } from "../types/roles.js";

const seedUsers: Array<{ name: string; email: string; role: Role; password: string }> = [
  { name: "Admin User", email: "admin@lms.test", role: "ADMIN", password: "Password@123" },
  { name: "Sales Executive", email: "sales@lms.test", role: "SALES", password: "Password@123" },
  { name: "Sanction Executive", email: "sanction@lms.test", role: "SANCTION", password: "Password@123" },
  {
    name: "Disbursement Executive",
    email: "disbursement@lms.test",
    role: "DISBURSEMENT",
    password: "Password@123"
  },
  {
    name: "Collection Executive",
    email: "collection@lms.test",
    role: "COLLECTION",
    password: "Password@123"
  },
  { name: "Borrower User", email: "borrower@lms.test", role: "BORROWER", password: "Password@123" }
];

async function seed() {
  await connectDb();

  for (const seedUser of seedUsers) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    await User.findOneAndUpdate(
      { email: seedUser.email },
      {
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        passwordHash
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded ${seedUser.role}: ${seedUser.email} / ${seedUser.password}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
