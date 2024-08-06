const express = require("express");
const bcrypt = require("bcrypt");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  console.log('get wala page')
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  console.log('post wala page');
  const userData = req.body;
  const enteredMail = userData.email;
  const enteredConfirmMail = userData["confirm-email"];
  const enteredPassword = userData.password;

  if (
    enteredMail !== enteredConfirmMail ||
    enteredPassword.length < 6 ||
    !enteredMail.includes("@")
  ) {
    console.log("Invalid input");
    return res.redirect("/signup");
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredMail });

  if (existingUser) {
    console.log("User already exists");
    return res.redirect("/signup");
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredMail,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredMail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredMail });

  if (!existingUser) {
    console.log("no user found or incorrect email");
    return res.redirect("/login");
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!passwordsAreEqual) {
    console.log("incorrect password!");
    return res.redirect("/login");
  }

  // console.log('authenticated!')
  // console.log(existingUser._id);
  // console.log(existingUser.email);

  req.session.users = { id: existingUser._id, email: existingUser.email };
  req.session.isAuthenticated = true;
  req.session.save(function () {
    res.redirect("/admin");
  });
  // req.session.users = { id: existingUser._id, email: existingUser.email };
  // console.log(req.session.users); // Debug statement
  // req.session.isAuthenticated = true;
  // req.session.save(function (err) {
  //   if (err) {
  //     console.error("Session save error:", err); // Log any session save errors
  //   } else {
  //     res.redirect("/admin");
  //   }
  // });
});

router.get("/admin", function (req, res) {
  // console.log(req.session.users); // Debug statement
  if (!req.session.isAuthenticated) {
    return res.status(401).render("401");
  }

  res.render("admin");
});

router.post("/logout", function (req, res) {
  req.session.users = null;
  req.session.isAuthenticated = false;
  res.redirect("/");
});

module.exports = router;
