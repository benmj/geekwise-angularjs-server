/*
 * CONVERSATIONS resources 
 */

'use strict';

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

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

  var newConversation = {
    "subject" : req.body.subject,
    "messages" : [],
    "_id" : new BSON.ObjectID()
  };

  geekwise.synchronousUpdate('projects', query, {
    $push : {
      conversations : newConversation
    }
  }).then(function (count) {
    return geekwise.queryProjects(query);
  }).then(function (project) {
    var conversation = _.findWhere(project[0].conversations, { '_id' : newConversation._id.toString() });

    res.send(201, conversation);
  });
};

exports.get = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var query = {
    "conversations._id" : new BSON.ObjectID(req.params.id)
  };

  geekwise.queryProjects(query)
    .then(function (project) {
      var conversation = _.findWhere(project[0].conversations, { '_id' : req.params.id });

      var userIDs = _.chain(conversation.messages).pluck('user').uniq().value()

      geekwise.getListOfUsers(userIDs)
        .then(function (users) {
          conversation.messages = _.map(conversation.messages, function (message) {
            message.user = _.findWhere(users, { '_id' : message.user });
            return message;
          });

          res.send(200, conversation);
        });
    });
};

exports.put = function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

  var q = {
    "conversations._id" : new BSON.ObjectID(req.params.id)
  };

  if (!_.has(req.body, 'subject')) {
    res.send(400, "Must contain 'subject' in request body.");
    return;
  }

  geekwise.queryProjects(q)
    .then(function (projects) {
      var project = projects[0];

      var conversations = _.map(project.conversations, function (conversation) {
        if (conversation._id === req.params.id) {
          conversation.subject = req.body.subject;
        }
        conversation._id = new BSON.ObjectID(conversation._id);
        return conversation;
      });

      return geekwise.synchronousPut('projects', q, { conversations: conversations });
    }).then(function (count) {
      return geekwise.queryProjects(q);
    }).then(function (project) {
      var conversation = _.findWhere(project[0].conversations, { '_id' : req.params.id });

      res.send(200, conversation);
    });
};