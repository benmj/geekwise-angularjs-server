
/*
 * GET users listing.
 */

var mongo = require('mongodb'),
	BSON = mongo.BSONPure;;

var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/mydb';

exports.list = function(req, res){
	var q = {
		"_student" : req.params.student
	};

	if (req.params.hasOwnProperty('id')){
		q["_id"] = new BSON.ObjectID(req.params.id);
	}

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('users', function(er, collection) {
			collection.find(q).toArray(function (err, results) {
				res.json(results);
			});
		});
	});
};

exports.post = function(req, res) {
	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('users', function(er, collection) {
			collection.insert({
				'firstName': req.body.firstName || '',
				'lastName': req.body.lastName || '',
				'nickName': req.body.nickName || '',
				'email': req.body.email || '',
				'_student': req.params.student
			}, { safe: true}, function (err, doc) {
				res.send(doc);
			});
		})
	});
}