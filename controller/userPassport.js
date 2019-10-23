// config/passport.js
// load all the things we need
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
const AWS = require('aws-sdk');
const express = require('express');
const session = require('express-session');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const dynamodb = new AWS.DynamoDB();
const tableName = "Customers";


function passportUser(passport) {

    // used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user.customerID.S);
    });

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        dynamodb.getItem({ "TableName": "Customers", "Key": { "customerID": { "S": id } } }, function (err, data) {
            if (err) {
                done(err, data);
            } else {
                done(err, { "id": data.Item.customerID.S, "username": data.Item.username.S, "password": data.Item.password.S, });
            }
        })
    });

    // LOCAL LOGIN
    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, username, password, done) {
        var params = {
            "TableName": "Customers",
            "IndexName": "username_index",
            "KeyConditions": {
                "username": {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList": [{ "S": username }]
                }
            }
        }
        dynamodb.query(params, function (err, data) {
            if (err) {
                return done(err);
            }
            if (data.Items.length == 0) {
                return done(null, false, req.flash('loginMessage', 'No Customer found.'));
            }
            dynamodb.getItem({ "TableName": "Customers", "Key": { "customerID": data.Items[0]["customerID"] } }, function (err, data) {
                if (err) {
                    return done(err);
                }
                if (password === data.Item.password.S) {
                    return done(null, false);
                } else {
                    session.cookie.permission = "customer";
                    return done(null, data.Item);
                }
            })
        });
    }));
};

module.exports = {
    passportUser: passportUser,
}