/*
 * MESSAGES
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

var mongo = require('mongodb'),
  BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

var geekwise = require('../shared/synchronous.js');

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
    "_id" : new BSON.ObjectID(req.params.id)
  };

  var newMessage = {
    "message": req.body.message || '',
    "user" : req.body.user || '',
    "created": new Date(),
    "modified" : new Date(),
    "_id" : new BSON.ObjectID()
  };

  geekwise.queryProjects(query)
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
          });
        });
      });
    });
};

exports.put = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "conversations.messages._id" : new BSON.ObjectID(req.params.id)
  };

  geekwise.queryProjects(query)
    .then(function (projects) {
      var project = projects[0];

      var conversations = _.map(project.conversations, function (conversation) {
        conversation.messages = _.map(conversation.messages, function (message) {
          if (message._id === req.params.id) {
            message.message = req.body.message || '';
            message.modified = new Date();
          }
          message._id = new BSON.ObjectID(message._id);
          return message;
        });
        return conversation;
      });
      return geekwise.synchronousPut('projects', query, { conversations: conversations });
    })
    .then(function (count) {
      return geekwise.queryProjects(query);
    }).then(function (projects) {
      var message = _.chain(projects[0].conversations)
        .pluck('messages')
        .flatten()
        .findWhere({ '_id' : req.params.id })
        .value();

      if (message) {
        res.send(200, message);
      } else {
        res.send(404);
      }
    });
};

exports.get = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "_student" : req.params.student,
    "conversations.messages._id" : BSON.ObjectID(req.params.id)
  };

  geekwise.queryProjects(query)
    .then(function (project) {
      var message = _.chain(project[0].conversations)
        .pluck('messages')
        .flatten()
        .findWhere({ '_id' : req.params.id })
        .value();

      if (message) {
        res.send(200, message);
      } else {
        res.send(404);
      }
    });
};
