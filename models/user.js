const { ObjectID } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  followers: [
    {
      type: ObjectID,
      ref: "User",
    },
  ],
  following: [
    {
      type: ObjectID,
      ref: "User",
    },
  ],
});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
