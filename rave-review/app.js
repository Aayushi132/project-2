var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  methodOverride = require("method-override"),
  Restaurant = require("./models/restaurant.js"),
  Comment = require("./models/comment"),
  User = require("./models/user");
path = require("path");
review = require("./models/rev");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "js")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/restaurant_review", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const session = require("express-session");
//Passport configuration
app.use(
  session({
    secret: "first website",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 60000,
    },
  })
);

app.use(express.static(__dirname + "/public"));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("landing");
});

app.get("/restaurants", isLoggedIn, function (req, res) {
  Restaurant.find({}, function (err, allrestaurants) {
    if (!err) {
      res.render("restaurants", {
        restaurants: allrestaurants,
        currentUser: req.user,
      });
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/invalidLogin", function (req, res) {
  res.render("invalidLogin");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/logout", function (req, res) {
  //req.logout();
  req.session.destroy((err) => {
    res.redirect("/");
  });
});

// app.get("/logout", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
//   res.sendFile("/", { root: __dirname })
// );

app.get("/addRestaurant", isLoggedIn, function (req, res) {
  res.render("addRestaurant", { currentUser: req.user });
});

app.get("/contactUs", isLoggedIn, function (req, res) {
  res.render("contactUs", { currentUser: req.user });
});

app.post("/restaurants/add", isLoggedIn, function (req, res) {
  var newRestaurantname = req.body.name;
  var newRestaurantimage = req.body.image;
  var newRestaurantrating = req.body.rating;
  var newRestaurantdesc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username,
  };
  var newRestaurant = {
    name: newRestaurantname,
    image: newRestaurantimage,
    avgRating: newRestaurantrating,
    description: newRestaurantdesc,
    author: author,
  };
  Restaurant.create(newRestaurant, function (err, newlyCreated) {
    if (!err) {
      res.redirect("/restaurants");
    }
  });
});

app.get("/restaurants/:id", isLoggedIn, function (req, res) {
  Restaurant.findById(req.params.id)
    .populate("comments")
    .exec(function (err, foundRestaurant) {
      if (!err) {
        res.render("showRestaurant", {
          restaurant: foundRestaurant,
          currentUser: req.user,
        });
      }
    });
});

app.get(
  "/restaurants/:id/editRestaurant",
  isLoggedIn,
  checkOwnership,
  function (req, res) {
    Restaurant.findById(req.params.id, function (err, foundRestaurant) {
      if (!err) {
        res.render("editRestaurant", {
          restaurant: foundRestaurant,
          currentUser: req.user,
        });
      }
    });
  }
);

app.put("/restaurants/:id", checkOwnership, function (req, res) {
  Restaurant.findByIdAndUpdate(
    req.params.id,
    req.body.restaurant,
    function (err, updatedRestaurnt) {
      if (!err) {
        res.redirect("/restaurants/" + req.params.id);
      }
    }
  );
});

app.delete("/restaurants/:id", checkOwnership, function (req, res) {
  Restaurant.findByIdAndRemove(req.params.id, function (err) {
    if (!err) {
      res.redirect("/restaurants");
    }
  });
});

function checkOwnership(req, res, next) {
  Restaurant.findById(req.params.id, function (err, foundRestaurant) {
    if (foundRestaurant.author.id.equals(req.user._id)) {
      next();
    } else {
      res.redirect("back");
    }
  });
}

//=================================
// COMMENTS ROUTES
//=================================

app.post("/restaurants/:id", isLoggedIn, function (req, res) {
  Restaurant.findById(req.params.id, function (err, restaurant) {
    if (err) {
      res.redirect("/restaurants");
    } else {
      Comment.create(req.body.comment, function (err, comment) {
        if (!err) {
          comment.author.id = req.user._id;
          comment.author.firstname = req.user.firstname;

          comment.author.comments = req.user.comments;

          comment.save();
          restaurant.comments.push(comment);
          restaurant.save();
          res.redirect("/restaurants/" + restaurant._id);
        }
      });
    }
  });
});

app.get("/review", async (req, res) => {
  res.redirect("/");
});

// app.post("/review",async (req,res)=>{

// 	// var firstname = req.body.firstname;
// 	// var lastname = req.body.lastname;
// 	// var email = req.body.email;
// 	// var phone = req.body.phone;
// 	// var newreview = {firstname:firstname,lastname:lastname,email:email,phone:phone};
// 	// review.create(newreview,function(err,newlyCreated){
// 	// 	if(!err){
// 	// 		res.send("saved");
// 	// 	}
// 		res.sendFile(path.join(__dirname +"/ht.html"));
// 	});

// 					const comment=await new Comment (req.body);
// 						comment.save();
// 						res.status(200).json('comment saved successfully')
// })

app.delete(
  "/restaurants/:id/comments/:comment_id",
  checkCommentOwnership,
  function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
      if (!err) {
        res.redirect("back");
      }
    });
  }
);

function checkCommentOwnership(req, res, next) {
  Comment.findById(req.params.comment_id, function (err, foundComment) {
    if (foundComment.author.id.equals(req.user._id)) {
      next();
    } else {
      res.redirect("back");
    }
  });
}

//======================
//AUTHENTICATION ROUTES
//======================

app.get("/signup", function (req, res) {
  res.render("signup");
});
app.post("/signup", function (req, res) {
  User.register(
    new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
    }),

    req.body.password,
    function (err, user) {
      if (err) {
        return res.render("signup");
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/restaurants");
      });
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login");
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/restaurants",
    failureRedirect: "/invalidLogin",
  })
);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

const port = process.env.PORT || 3000;
app.listen(port, function (req, res) {
  console.log("Server started...!!!");
});
