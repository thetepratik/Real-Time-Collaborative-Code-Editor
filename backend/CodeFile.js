import mongoose from "mongoose";

const CodeFileSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CodeFile", CodeFileSchema);
