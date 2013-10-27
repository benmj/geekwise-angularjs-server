
/*
 * GET users listing.
 */

var mongo = require('mongodb'),
	BSON = mongo.BSONPure;

var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/mydb';

exports.list = function(req, res){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	var q = {
		"_student" : req.params.student
	};

	if (req.params.hasOwnProperty('id')){
		q["_id"] = new BSON.ObjectID(req.params.id);
	}

	mongo.Db.connect(mongoUri, function (err, db) {
		if (err) {
			console.log(err);
			return;
		}

		db.collection('users', function(er, collection) {
			collection.find(q).toArray(function (err, results) {
				if (results.length) {
					res.json(results);
				} else {
					res.send(404);
				}
			});
		});
	});
};

exports.post = function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('users', function(er, collection) {
			collection.insert({
				'firstName': req.body.firstName || '',
				'lastName': req.body.lastName || '',
				'nickName': req.body.nickName || '',
				'email': req.body.email || '',
				'_student': req.params.student
			}, { safe: true}, function (err, doc) {
				res.send(201, doc);
			});
		})
	});
}

exports.put = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	
 	var q = {
		"_student" : req.params.student,
		"_id" : new BSON.ObjectID(req.params.id)
	};

	var u = {
		"_student" : req.params.student
	};

	if (req.body.hasOwnProperty('firstName'))
		u['firstName'] = req.body.firstName;
	if (req.body.hasOwnProperty('lastName'))
		u['lastName'] = req.body.lastName;
	if (req.body.hasOwnProperty('nickName'))
		u['nickName'] = req.body.nickName;
	if (req.body.hasOwnProperty('email'))
		u['email'] = req.body.email;

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('users', function (er, collection) {
			collection.update(q, { $set: u }, function (err, count) {

				collection.find(q).toArray(function (err, results) {
					if (results.length) {
						res.json(results);
					} else {
						res.send(404);
					}
				});
			});
		})
	})
}

exports.delete = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

 	var q = {
		"_student" : req.params.student,
		"_id" : new BSON.ObjectID(req.params.id)
	};

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('users', function (er, collection) {
			collection.remove(q, function (err, doc) {
				// 204 No Content
				res.send(204);
			});
		})
	})
}