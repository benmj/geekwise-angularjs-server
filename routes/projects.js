/*
 * PROJECTS resources
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

var mongo = require('mongodb'),
  BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

var geekwise = require('../shared/synchronous.js');

function transformProjectsAddTeam(projects) {
  var userPromises = [];

  var deferred = Q.defer();

  _.chain(projects)
    .pluck('team')
    .flatten()
    .uniq()
    .each(function (id) {
      userPromises.push(geekwise.queryUsers({ '_id' : new BSON.ObjectID(id)}));
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

function transformProjectsAddUsers(data) {
  // One cannot pass multiple values through Q.resolve. Must wrap in an array
  var projects = data[0];
  var usersData = data[1];

  var deferred = Q.defer();

  projects = _.map(projects, function (project) {
    project.conversations = _.map(project.conversations, function (conversation) {
      conversation.messages = _.map(conversation.messages, function (message) {
        var user = _.findWhere(usersData, { '_id' : message.user });
        message.user = user;
        return message;
      });

      return conversation;
    });

    return project;
  });

  deferred.resolve(projects);

  return deferred.promise;
}

exports.list = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var q = {
    "_student" : req.params.student
  };

  if (req.params.hasOwnProperty('id')) {
    q._id = new BSON.ObjectID(req.params.id);
  }

  geekwise.queryProjects(q)
    .then(transformProjectsAddTeam)
    .then(transformProjectsAddUsers)
    .then(function (projects) {
      if (projects.length) {
        res.send(
          _.map(projects, function (project) {
            if (!_.has(project, 'dueDate')) {
              project.dueDate = null;
            }
            return project;
          })
        );
      } else {
        res.send(404);
      }
    });
};

exports.post = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  geekwise.synchronousInsert('projects', {
    "title": req.body.title || '',
    "description": req.body.description || '',
    "status": req.body.status || '',
    "conversations" : [],
    "team": req.body.team || [],
    "dueDate": _.has(req.body, 'dueDate') ? new Date(req.body.dueDate) : null,
    "_student" : req.params.student
  })
    .then(transformProjectsAddTeam)
    .then(transformProjectsAddUsers)
    .then(function (newProject) {
      res.send(newProject);
    });
};

exports.put = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var q = {
    "_id" : new BSON.ObjectID(req.params.id)
  };

  var u = {};

  if (_.has(req.body, 'title')) {
    u.title = req.body.title;
  }
  if (_.has(req.body, 'description')) {
    u.description = req.body.description;
  }
  if (_.has(req.body, 'status')) {
    u.status = req.body.status;
  }
  if (_.has(req.body, 'dueDate')) {
    u.dueDate = req.body.dueDate;
  }
  if (_.has(req.body, 'team')) {
    u.team = req.body.team;
  }

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('projects', function (err, collection) {
      collection.update(q, { $set: u }, function (err, count) {

        geekwise.queryProjects(q)
          .then(transformProjectsAddTeam)
          .then(transformProjectsAddUsers)
          .then(function (projects) {
            if (projects.length) {
              res.send(
                _.map(projects, function (project) {
                  if (!_.has(project, 'dueDate')) {
                    project.dueDate = null;
                  }
                  return project;
                })
              );
            } else {
              res.send(404);
            }
          });
      });
    });
  });
};
