var express = require('express');
var bobyParser = require('body-parser')
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var feedParser = require('./SqlAction.js').feedParser;
var server = express();


server.use(bobyParser.json());
server.use(bobyParser.urlencoded({
    extended: true
}));

server.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

server.set('secret', 'sercet__1199102__key')

server.use((req, res, next) => {
    if (req.originalUrl != '/setup' && req.originalUrl != '/' && req.originalUrl != '/login') {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, server.get('secret'), function (err, decoded) {
                if (err) {
                    res.end('Invalid token');
                } else {
                    req.user = decoded;
                    next();
                }
            })
        } else {
            res.statusCode = 403;
            res.end('Forbidden');
        }
    } else {
        next();
    }
});
var sql = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1199102gosha', 
    database: 'test_db'
})



sql.connect((err, conn) => {
    if(err) throw err;
    server.listen(6060, (err) => {
        if(err) throw err;
        console.log('Server is work!')
        var dbConvert = 'ALTER DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        var user = 'CREATE TABLE IF NOT EXISTS user( email VARCHAR(50) UNIQUE, password VARCHAR(16) NOT NULL, id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)';
        var channel = 'CREATE TABLE IF NOT EXISTS channel( url VARCHAR(100) NOT NULL, provider VARCHAR(16) NOT NULL, id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)';
        var user_channel = 'CREATE TABLE IF NOT EXISTS user_channel( user_id INT NOT NULL, channel_id  INT NOT NULL, PRIMARY KEY(user_id, channel_id))';
        var feed = 'CREATE TABLE IF NOT EXISTS feed (title TEXT NOT NULL, link TEXT NOT NULL, create_date VARCHAR(60), content TEXT NOT NULL, id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)'
        var channel_feed = 'CREATE TABLE IF NOT EXISTS channel_feed(channel_id INT NOT NULL, feed_id  INT NOT NULL, PRIMARY KEY(channel_id, feed_id))'
        sql.query(dbConvert, (err)=> {
            if (err) throw err;
            sql.query(user, (err) => {
                if (err) throw err;
                sql.query(channel, (err) => {
                    if (err) throw err;
                    sql.query(user_channel, (err) => {                
                        if (err) throw err;
                        sql.query(feed, (err) => {
                            if (err) throw err;
                            sql.query(channel_feed, (err) => {
                                if (err) throw err;
                                sql.query('SELECT * FROM channel',(err, list) =>{
                                    if (err) throw err;
                                    list.map(item => feedParser(item, sql));
                                })
                            })
                        })
                    })
                })
            })            
        })
    })
})
exports.sql = sql;
exports.server = server;
