import { connect, Schema, model } from "mongoose";

const userSchema = Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  batchNumber: {
    type: String,
  },
  district: {
    type: String,
  },
  state: {
    type: String,
  },
  department: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
});

const User = model("user", userSchema);

export default User;
