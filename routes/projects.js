/*
 * PROJECTS resources
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

var mongo = require('mongodb'),
  BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

var geekwise = require('../shared/synchronous.js');

// goal is to beat the 70 ms
exports.list2 = function (req, res) {
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
        // this is a hack, we want a 404 if there was an id, but an empty set if getting the /list
        if (_.has(q, "_id")) {
          res.send(404);
        } else {
          res.json([]);
        }
      }      
    })
};

exports.post2 = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  if (!req.get('Content-Type') || req.get('Content-Type').indexOf('application/json') == -1) {
    res.send(400, 'You must set the Content-Type header to "application/json"');
    return;
  }

  var team = req.body.team || [];

  geekwise.getListOfUsers(team)
    .then(function (usersOnTeam) {
      return geekwise.synchronousInsert('projects', {
          "title": req.body.title || '',
          "description": req.body.description || '',
          "status": req.body.status || '',
          "conversations" : [],
          "dueDate": _.has(req.body, 'dueDate') ? new Date(req.body.dueDate) : null,
          "_student" : req.params.student,
          "team": usersOnTeam,
      });
    }).then(function (newProject) {
      res.send(newProject);
    });
};

exports.put2 = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  if (!req.get('Content-Type') || req.get('Content-Type').indexOf('application/json') == -1) {
    res.send(400, 'You must set the Content-Type header to "application/json"');
    return;
  }

  var q = {
    "_id" : new BSON.ObjectID(req.params.id)
  };

  var u = {};

  if (_.has(req.body, "title")) {
    u.title = req.body.title;
  }
  if (_.has(req.body, "description")) {
    u.description = req.body.description;
  }
  if (_.has(req.body, "status")) {
    u.status = req.body.status;
  }
  if (_.has(req.body, "conversations")) {
    u.conversations = req.body.conversations;
  }
  if (_.has(req.body, "dueDate")) {
    u.dueDate = req.body.dueDate;
  }

  var team = req.body.team || [];

  geekwise.getListOfUsers(team)
    .then(function (usersOnTeam) {
      u.team = usersOnTeam;
  
      return geekwise.synchronousPut('projects', q, u);
    }).then(function () {
      return geekwise.queryProjects(q);
    }).then(function (projects) {
      res.send(projects);
    });
};

exports.remove = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var q = {
    "_id" : new BSON.ObjectID(req.params.id)
  };

  geekwise.synchronousRemove('projects', q)
    .then(function () {
      res.send(204);
    });
};