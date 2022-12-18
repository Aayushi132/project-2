
var mongoose = require("mongoose");
var commentSchema = mongoose.Schema({
	text: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		
	createdAt:{
		type:Date,
		default:Date.now
	},
		comments:String

	}
});
module.exports = mongoose.model("Comment",commentSchema); 