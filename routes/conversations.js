/*
 * CONVERSATIONS resources 
 */

var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/mydb';

var mongo = require('mongodb'),
	BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

exports.list = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	res.send(200);
};

exports.post = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	var query = {
		"_student" : req.params.student,
		"_id" : new BSON.ObjectID(req.params.id)
	};

	var newConversation = {
		"subject" : req.body.subject,
		"messages" : [],
		"_id" : new BSON.ObjectID()
	};

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection('projects', function (err, collection) {
			collection.update(query, { $push : { conversations : newConversation }});
		}, function (err, count) {
			res.send(201);
		});
	});
};