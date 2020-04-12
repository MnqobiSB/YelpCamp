var express 	= require("express"),
	app		 	= express(),
	bodyParser 	= require("body-parser"),
	mongoose 	= require("mongoose"),
	flash		= require("connect-flash"),
	passport	= require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Campground 	= require("./models/campground"),
	Comment 	= require("./models/comment"),
	User 		= require("./models/user"),
	seedDB		= require("./seeds")

// REQUIRING ROUTES
var campgroundRoutes = require("./routes/campgrounds"),
	commentRoutes 	 = require("./routes/comments"),
	reviewRoutes     = require("./routes/reviews"),
	indexRoutes 	 = require("./routes/index")


// Local MongoDB
mongoose.connect(process.env.DATABASEURL, {
	useNewUrlParser: true, 
	useUnifiedTopology: true, 
	useCreateIndex: true}).then(() => {
		console.log("Connected to DB!");
	}).catch(err => {
		console.log("ERROR:", err.message);
	});
// Online MongoDB Atlas 
// mongoose.connect("mongodb+srv://mnqobi:EgE0o7C6WIWcTV7i@cluster0-pgb8i.mongodb.net/test?retryWrites=true&w=majority", {
// 	useNewUrlParser: true, 
// 	useUnifiedTopology: true,
// 	useFindAndModify: false, 
// 	useCreateIndex: true}).then(() => {
// 		console.log("Connected to DB!");
// 	}).catch(err => {
// 		console.log("ERROR:", err.message);
// 	});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//require moment
app.locals.moment = require('moment');
// seedDB(); // seed the database

// PASSPORT CONFIG
app.use(require("express-session")({
	secret: "Once again Web Dev is awesome",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

// PORT QUERY 
var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("The YelpCamp Server Has Started!");
});