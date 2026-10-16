const express = require("express");
const main = express();
const multer = require("multer");
const session = require('express-session');
const bcrypt = require("bcryptjs");
const path = require("path");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value);

const validateRequiredFields = (body, fields) => {
  const missingField = fields.find(
    (field) => typeof body[field] !== "string" || body[field].trim() === ""
  );
  return missingField
    ? `${missingField} is required`
    : null;
};

const cors = require('cors');
main.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dezcoder.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST']
}));

main.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

const User = require("./user");
const Question = require("./questionschema");
const {
  detectPlatform,
  filterQuestions,
  isValidProgressStatus,
} = require("./utils");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, path.join(__dirname, "views", "uploads"));
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

main.use(express.json());
main.set("view engine", "ejs");
main.use(express.urlencoded({ extended: false }));
main.use(express.static(path.join(__dirname, "views")));
main.listen(process.env.PORT || 5000, () => {
  console.log(`Server listening on port ${process.env.PORT || 5000}`);
});

main.get("/", async (req, res) => {
  const id = "68c06cf05638579c40171040";
  const user = await User.findById(id);
  const questions = await Question.find();
  res.render("landing", { user, questions });
});
main.post("/questions", async (req, res) => {
  const userEmail = req.query.email;
  //const userId = "665aa2ad3c5c5ce5ada302b0";
  const { title, link, topics, solution, difficulty = "Medium" } = req.body;
  let parsedLink;
  try {
    parsedLink = new URL(link);
  } catch {
    return res.status(400).json({ message: "link must be a valid http(s) URL" });
  }
  if (parsedLink.protocol !== "http:" && parsedLink.protocol !== "https:") {
    return res.status(400).json({ message: "link must be a valid http(s) URL" });
  }
  if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
    return res.status(400).json({ message: "difficulty must be Easy, Medium, or Hard" });
  }
  const topicsArray = Array.isArray(topics) ? topics : [topics];
  const question = new Question({
    title: title,
    link: link,
    topics: topicsArray,
    difficulty,
    platform: detectPlatform(link),
    solution: solution
  });

  try {
    await question.save();
    const user = await User.findOne({ email: userEmail });
    if (user) {
      
        const questions = await Question.find();
        return res.json({ user, questions });
        //res.render("landing", { user, questions });
      
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});


main.post("/register", upload.single("profile_image"), async (req, res) => {
  try {
    const missingField = validateRequiredFields(req.body, [
      "first_name",
      "last_name",
      "city",
      "college",
      "email",
      "userhandle",
      "password",
    ]);
    if (missingField) {
      return res.status(400).json({ message: missingField });
    }
    if (!emailPattern.test(req.body.email.trim())) {
      return res.status(400).json({ message: "email must be valid" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "profile_image is required" });
    }

    const user = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      city: req.body.city,
      college: req.body.college,
      email: req.body.email.trim(),
      userhandle: req.body.userhandle.toLowerCase(),
      profile_image: req.body.profile_image,
      password: await bcrypt.hash(req.body.password, 12),
      bookmark: [],
      following: [],
    });

    try {
      await user.save();
      const questions = await Question.find();
      if (req.session.questionToBookmark) {
        user.bookmark.push(req.session.questionToBookmark);
        await user.save();
        req.session.questionToBookmark = null;
      }
      if (req.session.bookmark) {
        const bookmarkedQuestions = await Question.find({
          _id: { $in: user.bookmark },
        });
       // res.render("bookmarkquestions", { user, bookmarkedQuestions });
        req.session.bookmark = null;
        return;
      }
     return res.json({ user, questions });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).send("Email already exists");
      } else {
        console.error("Error inserting data into MongoDB:", err);
        return res.status(500).send("Internal Server Error");

      }
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error occurred");
  }
});

main.post("/signin", async (req, res) => {
  try {
    const missingField = validateRequiredFields(req.body, ["email", "password"]);
    if (missingField) {
      return res.status(400).json({ message: missingField });
    }
    if (!emailPattern.test(req.body.email.trim())) {
      return res.status(400).json({ message: "email must be valid" });
    }

    const user = await User.findOne({ email: req.body.email.trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = isBcryptHash(user.password)
      ? await bcrypt.compare(req.body.password, user.password)
      : user.password === req.body.password;

    if (passwordMatches) {
      if (!isBcryptHash(user.password)) {
        user.password = await bcrypt.hash(req.body.password, 12);
        await user.save();
      }
      const questions = await Question.find();
      if (req.session.questionToBookmark) {
        user.bookmark.push(req.session.questionToBookmark);
        await user.save();
        req.session.questionToBookmark = null;
      }
      if (req.session.bookmark) {
        const bookmarkedQuestions = await Question.find({
          _id: { $in: user.bookmark },
        });
        req.session.bookmark = null;
       // return res.render("bookmarkquestions", { user, bookmarkedQuestions });
       return res.json({ user, bookmarkedQuestions });
      }

      //res.render("landing", { user, questions });
      return res.json({ user, questions });
    } else {

     
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
      //res.render("signin1");
    }
  } catch {
    
    return res.status(500).json({ message: "An error occurred during sign-in" });
  }
});

main.post("/bookmark/:questionId/:email", async (req, res) => {
  const userEmail = req.params.email;
  console.log(userEmail);
  //const userId = "665aa2ad3c5c5ce5ada302b0";
  const questionId = req.params.questionId;

  const user = await User.findOne({email: userEmail});
  if (user) {
    
      if (!user.bookmark.includes(questionId)) {
        user.bookmark.push(questionId);
        await user.save();
      }else{
        return res.status(400).send("Question already bookmarked");
      }
      const questions = await Question.find();
     return res.json({ user,bookmark: user.bookmark});
    
  } else {
    res.status(404).send("User not found");
  }
});

main.get("/bookmarkquestions", async (req, res) => {
  const userEmail = req.query.email;
  const userId = "665aa2ad3c5c5ce5ada302b0";

  try {
    const user = await User.findOne({ email: userEmail });
    if (user) {
    
        const bookmarkedQuestions = await Question.find({
          _id: { $in: user.bookmark },
        });
        const questionsWithStatus = bookmarkedQuestions.map((question) => ({
          ...question.toObject(),
          status: user.progress?.get(question._id.toString()) || "unsolved",
        }));
        const filteredQuestions = filterQuestions(questionsWithStatus, {
          tag: req.query.tag,
          difficulty: req.query.difficulty,
          platform: req.query.platform,
          status: req.query.status,
          q: req.query.q,
        });
       return res.json({ user, bookmarkedQuestions: filteredQuestions });
      
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

main.post("/progress/:questionId/:email", async (req, res) => {
  const { questionId, email } = req.params;
  const { status } = req.body;
  if (!isValidProgressStatus(status)) {
    return res.status(400).json({
      message: "status must be unsolved, in-progress, or solved",
    });
  }
  if (!/^[a-f\d]{24}$/i.test(questionId)) {
    return res.status(400).json({ message: "questionId must be valid" });
  }

  try {
    const [user, question] = await Promise.all([
      User.findOne({ email }),
      Question.findById(questionId),
    ]);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (!user.progress) {
      user.progress = new Map();
    }
    user.progress.set(questionId, status);
    await user.save();
    return res.json({ status });
  } catch (error) {
    console.error("Error updating question progress:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

main.post("/unbookmark/:questionId/:email", async (req, res) => {
  const userEmail = req.params.email;
  const questionId = req.params.questionId;

  const user = await User.findOne({ email: userEmail });
  if (user) {
    index = user.bookmark.findIndex((id) => id !== questionId);
    if (index !== -1) {
      user.bookmark.splice(index, 1);
    }
    await user.save();
      const bookmarkedQuestions = await Question.find({
      _id: { $in: user.bookmark },
    });
    return res.json({ user, bookmarkedQuestions });
  } else {
    res.status(404).send("User not found");
  }
});

main.get("/landing", async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
      const questions = await Question.find();
      res.render("landing", { user, questions });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

main.get("/question", async (req, res) => {
  const userEmail = req.query.email;
  const user = await User.findOne({ email: userEmail });
  const questions = await Question.find();
  return res.json({ user, questions });
});

main.get('/profile', async (req, res) => {
  const userId = "6662cd42490ac3d411468604";
  try {
    const user = await User.findOne({ email: req.query.email });
    
       // console.log('Profile Image:', user.profile_image);
       // res.render('profile', { user });
        return res.json({ user });
      
    }
  catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).send('Internal Server Error');
  }
});

main.get("/edit", async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
    res.render("edit", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

main.post("/update", async (req, res) => {
  try {
    const missingField = validateRequiredFields(req.body, [
      "first_name",
      "last_name",
      "city",
      "college",
      "email",
      "userhandle",
      "password",
    ]);
    if (!req.query.userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (missingField) {
      return res.status(400).json({ message: missingField });
    }
    if (!emailPattern.test(req.body.email.trim())) {
      return res.status(400).json({ message: "email must be valid" });
    }

    const updatedUser = await User.findById(req.query.userId);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const submittedPassword = req.body.password;
    const password = isBcryptHash(updatedUser.password) &&
      submittedPassword === updatedUser.password
      ? updatedUser.password
      : await bcrypt.hash(submittedPassword, 12);

    updatedUser.first_name = req.body.first_name;
    updatedUser.last_name = req.body.last_name;
    updatedUser.city = req.body.city;
    updatedUser.college = req.body.college;
    updatedUser.email = req.body.email.trim();
    updatedUser.userhandle = req.body.userhandle;
    updatedUser.password = password;
    await updatedUser.save();

    return res.json({ user: updatedUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email or user handle already exists" });
    }
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
});

main.get("/handle", async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
    res.render("addhandle", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

main.post("/addHandles", async (req, res) => {

  try {
      const { userId, handleName, handleLink } = req.body;

      const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { $set: { [`handles.${handleName}`]: handleLink } },
          { new: true }
      );

     return res.json({ user: updatedUser });
  } catch (error) {
      console.error("Error updating handles:", error);
      res.status(500).send("Internal Server Error");
  }
});

main.get('/searchUser', async (req, res) => {
 // const usercurrId = req.query.userId; // Use req.query.userId for GET requests
  try {
      const userhandle = req.query.userhandle.toLowerCase();
      const user = await User.findOne({ userhandle });

      if (!user) {
          return res.status(404).send("User not found");
      }
      return res.json({ user }); 
  } catch (error) {
      console.error("Error searching user:", error);
      res.status(500).send("Internal Server Error");
  }
});


main.get("/profile", async (req, res) => {
  const userId = req.query.userId;

  try {
    const user = await User.findById(userId);
    res.render("profile", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

main.post('/follow/:userId', async (req, res) => {
  const userId = req.params.userId;
  const userIdToFollow = req.body.userIdtofollow;

  if (userIdToFollow === userId) {
      return res.status(400).send("You cannot follow yourself");
  }

  try {
    const user = await User.findById(userId);

      if (!user.following) {
        user.following = [];
        user.following.push(userIdToFollow);
      }
      if (!user.following.includes(userIdToFollow)) {
        user.following.push(userIdToFollow);
        await user.save();
    }
    

      //res.render("profile", { user });
      return res.json({ user });
  } catch (error) {
      console.error("Error following user:", error);
      res.status(500).send("Internal Server Error");
  }
});
