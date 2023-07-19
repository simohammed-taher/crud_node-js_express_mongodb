const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");
// const path = require("path");
// const LogInCollection = require("../models/connexion");

// image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

// Insert user on database
router.post("/add", upload, async (req, res) => {
  try {
    // Check if the required fields are provided
    const { name, email, phone } = req.body;
    if (!name || !email || !phone || !req.file) {
      return res.json({
        message: "Please provide all the required information.",
        type: "danger",
      });
    }

    const user = new User({
      name: name,
      email: email,
      phone: phone,
      image: req.file.filename,
    });

    // Save the user using async/await
    await user.save();

    req.session.message = {
      type: "success",
      message: "User added successfully!",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

//Get all users route
router.get("/", async (req, res) => {
  try {
    const users = await User.find().exec();
    res.render("index", {
      title: "Home Page",
      users: users,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
});
router.get("/add", (req, res) => {
  res.render("add_user", { title: "Add Users" });
});
//connexion
router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});
router.get("/signup", (req, res) => {
  res.render("signup", { title: "signup" });
});

// POST route for handling user registration (signup)
// router.post("/signup", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Check if the required fields are provided
//     if (!name || !email || !password) {
//       return res.json({
//         message: "Please provide all the required information.",
//         type: "danger",
//       });
//     }

//     // Check if the user already exists with the provided email
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.json({
//         message:
//           "User with this email already exists. Please use a different email.",
//         type: "danger",
//       });
//     }

//     // Create a new user object using the User model
//     const newUser = new User({
//       name: name,
//       email: email,
//       password: password, // In a real-world application, you should hash the password before saving it.
//     });

//     // Save the new user to the database
//     await newUser.save();

//     // Set a success message in the session (you can use express-session for this)
//     req.session.message = {
//       type: "success",
//       message: "User registered successfully!",
//     };

//     // Redirect the user to a dashboard page or any other appropriate route
//     res.redirect("/dashboard");
//   } catch (err) {
//     // Handle errors and send an error JSON response
//     res.json({ message: err.message, type: "danger" });
//   }
// });

// // POST route for handling login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if the required fields are provided
//     if (!email || !password) {
//       return res.json({
//         message: "Please provide both email and password.",
//         type: "danger",
//       });
//     }

//     // Find the user by email
//     const user = await User.findOne({ email });

//     // Check if the user exists
//     if (!user) {
//       return res.json({
//         message: "User not found. Please check your email and try again.",
//         type: "danger",
//       });
//     }

//     // In a real-world application, you should use bcrypt to compare hashed passwords.
//     // For simplicity, we are comparing the plain password here.
//     if (user.password !== password) {
//       return res.json({
//         message: "Invalid password. Please check your password and try again.",
//         type: "danger",
//       });
//     }

//     // Set a success message in the session (you can use express-session for this)
//     req.session.message = {
//       type: "success",
//       message: "Login successful!",
//     };

//     // Redirect the user to a dashboard page or any other appropriate route
//     res.redirect("/dashboard");
//   } catch (err) {
//     // Handle errors and send an error JSON response
//     res.json({ message: err.message, type: "danger" });
//   }
// });

//Edit an user route
router.get("/edit/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let user = await User.findById(id).exec();

    if (user == null) {
      res.redirect("/");
    } else {
      res.render("edit_user", {
        title: "Edit User",
        user: user,
      });
    }
  } catch (err) {
    res.redirect("/");
  }
});

//Update user route
router.post("/update/:id", upload, async (req, res) => {
  const id = req.params.id;
  let new_image = "";

  if (req.file) {
    new_image = req.file.filename;
    if (req.body.old_image) {
      try {
        fs.unlinkSync("./uploads/" + req.body.old_image);
      } catch (err) {
        console.error(err);
        return res.json({ message: "Failed to update image.", type: "danger" });
      }
    }
  } else {
    new_image = req.body.old_image;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({ message: "User not found.", type: "danger" });
    }

    req.session.message = {
      type: "success",
      message: "User updated successfully!",
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.json({ message: "Failed to update user.", type: "danger" });
  }
});

// Delet user route
router.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.json({ message: "User not found.", type: "danger" });
    }
    if (deletedUser.image) {
      try {
        fs.unlinkSync("./uploads/" + deletedUser.image);
      } catch (err) {
        console.error(err);
        return res.json({
          message: "Failed to delete user's image.",
          type: "danger",
        });
      }
    }

    req.session.message = {
      type: "success",
      message: "User deleted successfully!",
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.json({ message: "Failed to delete user.", type: "danger" });
  }
});

module.exports = router;
