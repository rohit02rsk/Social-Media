const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const MongoDBStore = require("connect-mongo");
const flash = require("connect-flash");

const User = require("./models/user");
const Post = require("./models/post");

//Connect to DB
const dbUrl = "mongodb://localhost:27017/socialMediaRecords";
mongoose.connect(dbUrl);
mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();

app.use(flash());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

//Using sessions
const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = MongoDBStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret,
  },
});

store.on("error", (e) => {
  console.log("Session Store Error!", e);
});

const sessionConfig = {
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

//Using passport for login and logout and hashing passwords
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Home page
app.get("/", (req, res) => {
  res.render("home");
});

//Show all users
app.get("/users", async (req, res) => {
  const users = await User.find({});
  res.render("users/index", { users });
});

//Render form to register new user
app.get("/users/new", async (req, res) => {
  res.render("users/new");
});

//Render form to login user
app.get("/users/login", (req, res) => {
  res.render("users/login");
});

//Get user data with given ID
app.get("/users/:username", async (req, res) => {
  const { username } = req.params;
  const user = await User.find({ username: username });
  res.render("users/show", { user });
});

//Show followers
app.get("users/:username/followers", async (req, res) => {
  const { username } = req.params;
  const user = await User.find({ username: username });
  //console.dir(user);
  res.render("/users/followers", { user });
});

//Show following
app.get("users/:username/following", async (req, res) => {
  const { username } = req.params;
  const user = await User.find({ username: username });
  //console.dir(user);
  res.render("/users/following", { user });
});

//Follow another user
app.post("users/:username/follow", async (req, res) => {
  const { username } = req.params;
  const user = await User.findOneAndUpdate(
    { username: username },
    { $push: { followers: req.user._id } }
  );
  //console.dir(user);
  res.redirect("/users");
});

//Unfollow user
app.delete("users/:username/follow", async (req, res) => {
  const { username } = req.params;
  const user = await User.findOneAndUpdate(
    { username: username },
    { $pull: { followers: req.user._id } }
  );
  //console.dir(user);
  res.redirect("/users");
});

//Post new user data
app.post("/users", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Your account has successfully been created!");
      res.redirect("/users");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/users/new");
  }
});

//Get posts
app.get("/posts", (req, res) => {
  res.render("posts/index");
});

//Create post
app.post("/posts", async (req, res) => {
  res.redirect("/posts");
});

//Post request to login user
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/users");
  }
);

//Server up and running
app.listen(3000, () => {
  console.log("App is listening on PORT 3000");
});
