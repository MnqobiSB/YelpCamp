var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");

// INDEX - show all campgrounds
router.get("/", function(req, res){
	var perPage = 4;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	// search query
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Get all campgrounds from DB
		Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
			Campground.count({name: regex}).exec(function (err, count) {
				if (err) {
					console.log(err);
					res.redirect("back");
				} else {
					if(allCampgrounds.length < 1) {
	                        req.flash("error", "Campground not found, search again!");
	                        return res.redirect("back");
	         		}
					res.render("campgrounds/index", {
						campgrounds: allCampgrounds, 
						page: "campgrounds",
						current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        search: req.query.search
					});		
				}
			});	
		});
	} else {
		// Get all campgrounds from DB
		Campground.find({}).skip((perPage * pageQuery) - perPage).limit(perPage).exec(function(err, allCampgrounds){
			Campground.count().exec(function(err, count){
				if (err) {
					console.log(err);
				} else {
					res.render("campgrounds/index", {
						campgrounds: allCampgrounds, 
						page: "campgrounds",
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						search: false
					});		
				}
			});
		});
	}
});


// CREATE - add new campground to database
router.post("/", middleware.isLoggedIn, function(req, res){
	// get data from form and add to campgrounds array
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newCampground = {name: name, price: price, mage: image, description: desc, author: author};
	// Create a new campground and save it to DB
	Campground.create(newCampground, function(err, newlyCreated){
		if (err) {
			console.log(err);
		} else {
			// redirect back to campgrounds page
			console.log(newlyCreated);
			res.redirect("/campgrounds");
		}
	});
});

// NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT - To edit campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("campgrounds/edit", {campground: foundCampground});
	}); 
});

// UPDATE - To update campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	delete req.body.campground.rating;
	// find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if (err) {
			res.redirect("/campgrounds");
		} else {
			// redirect to show page
			req.flash("success", "You have successfully updated the campground!");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});

// SEARCH QUERY - string refractor
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;