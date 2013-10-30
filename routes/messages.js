/*
 * MESSAGES
 */

var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/mydb';

var mongo = require('mongodb'),
	BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

function synchronousQuery(collectionName, query) {
	var deferred = Q.defer();

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection(collectionName, function (err, collection) {
			if (err) {
				console.warn(err);
			}

			collection.find(query).toArray(function (err, results) {
				if (err) {
					console.warn(err);
				}

				deferred.resolve(JSON.parse(JSON.stringify(results)));
			});
		});
	});

	return deferred.promise;
};

function queryUsers (query) {
	return synchronousQuery('users', query);
};

function queryConversations (query) {
	return synchronousQuery('conversations', query);
};

function queryProjects (query) {
	return synchronousQuery('projects', query);	
};

function synchronousInsert(collectionName, doc) {
	var deferred = Q.defer();

	mongo.Db.connect(mongoUri, function (err, db) {
		db.collection(collectionName, function (err, collection) {
			collection.insert(doc, { safe: true }, function (err, doc) {
				deferred.resolve(doc);
			});
		});
	});

	return deferred.promise;
};



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

	var newMessage = {
		"message": req.body.message || '',
        "user" : req.body.user || '',
		"created": new Date(),
        "modified" : new Date(),
		"_id" : new BSON.ObjectID()
	};

	queryProjects(query)
		.then(function (projects) {
			var project = projects[0];

			var conversation = _.findWhere(project.conversations, { "_id" : req.params.convId });

			var index = project.conversations.indexOf(conversation);

			conversation.messages.push(newMessage);

			project.conversations[index] = conversation;

			delete project._id;

			mongo.Db.connect(mongoUri, function (err, db) {
				db.collection('projects', function (err, collection) {
					collection.update(query, { $set: project }, function (err, count) {
						res.send(201, [ newMessage ]);
					})
				})
			})
		});
};