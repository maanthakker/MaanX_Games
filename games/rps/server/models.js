import mongoose from "mongoose";
import { STARTER, DEFAULT_EQUIP } from "../shared/catalog.js";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  usernameLower: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  coins: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  look: {
    skin: { type: Number, default: 1 },
    hair: { type: String, default: "short" },
    hairColor: { type: Number, default: 1 },
  },
  inventory: { type: [String], default: () => [...STARTER] },
  equipped: {
    shirt: { type: String, default: DEFAULT_EQUIP.shirt },
    pants: { type: String, default: DEFAULT_EQUIP.pants },
    shoes: { type: String, default: DEFAULT_EQUIP.shoes },
    acc: { type: String, default: DEFAULT_EQUIP.acc },
  },
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
userSchema.index({ wins: -1 });

const noteSchema = new Schema({
  to: { type: Schema.Types.ObjectId, ref: "User", index: true },
  from: { type: Schema.Types.ObjectId, ref: "User" },
  fromName: String,
  type: { type: String, enum: ["friend", "invite"] },
  mode: { type: String, enum: ["solo", "duo"] },
  status: { type: String, default: "pending" }, // pending | accepted | declined | expired
}, { timestamps: true });

export const User = model("User", userSchema);
export const Note = model("Note", noteSchema);
