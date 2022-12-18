var mongoose = require("mongoose");
var reviewSchema = mongoose.Schema({
firstname: String,
		lastname: String,
		email:String,
		phone:Number,
		description:String,
		
	// createdAt:{
	// 	type:Date,
	// 	default:Date.now
	// },
});
module.exports = mongoose.model("review",reviewSchema); 