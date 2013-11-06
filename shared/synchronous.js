/**
 * shared query methods for server
 */

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

var mongo = require('mongodb'),
  BSON = mongo.BSONPure;

var _ = require('underscore');
var Q = require('q');

exports.synchronousQuery = function (collectionName, query) {
  var deferred = Q.defer();

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection(collectionName, function (err, collection) {
      collection.find(query).toArray(function (err, results) {
        deferred.resolve(JSON.parse(JSON.stringify(results)));
      });
    });
  });

  return deferred.promise;
};

exports.queryUsers = function (query) {
  return this.synchronousQuery('users', query);
};

exports.queryProjects = function (query) {
  return this.synchronousQuery('projects', query);
};

exports.synchronousInsert = function (collectionName, doc) {
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

exports.synchronousPut = function (collectionName, query, update) {
  var deferred = Q.defer();

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection(collectionName, function (err, collection) {
      collection.update(query, { $set: update }, function (err, count) {
        console.warn(err);
        deferred.resolve(count);
      });
    });
  });

  return deferred.promise;
};

exports.synchronousUpdate = function (collectionName, query, update) {
  var deferred = Q.defer();

  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection(collectionName, function (err, collection) {
      collection.update(query, update, function (err, count) {
        deferred.resolve(count);
      });
    });
  });

  return deferred.promise;
};