/*
 * PROJECTS resources
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

function transformProjectsAddTeam (projects) {
	var userPromises = [];

	var deferred = Q.defer();

	_.chain(projects)
		.pluck('team')
		.flatten()
		.uniq()
		.each(function (id) {
			userPromises.push(queryUsers({ "_id" : new BSON.ObjectID(id) }));
		});

	Q.all(userPromises)
		.then(function (usersData) {
			usersData = _.flatten(usersData);

			projects = _.map(projects, function (project) {
				var users = [];

				_.each(project.team, function (id) {
					users.push(_.findWhere(usersData, { '_id' : id }));
				});

				project.team = _.filter(users, function (user) {
					return user; // add if truthy
				});

				return project;
			});

			deferred.resolve([projects, usersData]);
		});

	return deferred.promise;
}

function transformProjectsAddUsers (data) {
	// One cannot pass multiple values through Q.resolve. Must wrap in an array
	var projects = data[0];
	var usersData = data[1];

 	var deferred = Q.defer();

	projects = _.map(projects, function (project) {
		project.conversations = _.map(project.conversations, function (conversation) {
			conversation.messages = _.map(conversation.messages, function (message) {
				var user = _.findWhere(usersData, { '_id' : message.userId });
				message.user = user;
				delete message.userId;
				return message;
			});

			return conversation;
		});

		return project;
	});

	deferred.resolve(projects);

	return deferred.promise;
}

exports.list = function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	var q = {
		"_student" : req.params.student
	};

	if (req.params.hasOwnProperty('id')){
		q["_id"] = new BSON.ObjectID(req.params.id);
	}

	queryProjects(q)
		.then(transformProjectsAddTeam)
		.then(transformProjectsAddUsers)
		.then(function (projects) {
			if (projects.length) {
				res.send(projects);
			} else {
				res.send(404);
			}
		});
};

exports.post = function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

	synchronousInsert('projects', {
	    "title": req.body.title || '',
	    "description": req.body.description || '',
	    "status": req.body.status || '',
	    "conversations" : [],
	    "_student" : req.params.student
	})
	.then(transformProjectsAddTeam)
	.then(transformProjectsAddUsers)
	.then(function (newProject) {
		res.send(newProject);
	});

}