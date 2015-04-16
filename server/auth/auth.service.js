'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({ secret: config.secrets.session });
var _ = require('underscore');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */

function isAuthenticated() {

   /////////////// Auth fullstack ///////////////////
  return compose()
    // Validate jwt

    .use(function(req, res, next) {

          var userId = req.headers['x-user-id'];

    if (userId != undefined) {
      User.findById(userId, function (err, user) {
        if (err || user === null) {
          res.status(401).end();
        }
        else if (user.roles.length > 0) {
          req.user = user;
          next();
        }
        else {
          res.status(403).end();
        }
      });
    }
    else {
      res.status(401).end();
    }


      // // allow access_token to be passed through query parameter as well
      // if(req.query && req.query.hasOwnProperty('access_token')) {
      //   console.log("ici");
      //    req.headers.authorization = 'Bearer ' + req.query.access_token;
      //  }
      //  validateJwt(req, res, next);
    })
   // Attach user to request
    .use(function(req, res, next) {
      User.findById(req.user._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.send(401);

        req.user = user;
        next();
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {

  if (!roleRequired) throw new Error('Required role needs to be set');

   return compose()
   .use(function(req, res, next) {

    var userId = req.headers['x-user-id'];

    if (userId != undefined) {
      User.findById(userId, function (err, user) {
        if (err || user === null) {
          res.status(401).end();
        }
        else if (user.roles == roleRequired) {
          req.user = user;
          next();
        }
        else {
          res.json("votre role ne permet pas d'acceder à cette resource").end();
        }
      });
    }
    else {
      res.status(401).end();
    }


      // // allow access_token to be passed through query parameter as well
      // if(req.query && req.query.hasOwnProperty('access_token')) {
      //   console.log("ici");
      //    req.headers.authorization = 'Bearer ' + req.query.access_token;
      //  }
      //  validateJwt(req, res, next);
    })
  //   .use(isAuthenticated())
  //   .use(function meetsRequirements(req, res, next) {
  //     if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
  //       next();
  //     }
  //     else {
  //       res.send(403);
  //     }
  //   });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.secrets.session, { expiresInMinutes: 60*5 });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.json(404, { message: 'Something went wrong, please try again.'});
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;