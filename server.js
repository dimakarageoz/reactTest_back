var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var feedParser = require('./SqlAction.js').feedParser;
var server = express();

const DATA_BASE = 'feed_db';

server.use(bodyParser.urlencoded({
	extended: false
}));
server.use(bodyParser.json());

server.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Request-Headers', 'Content-type, X-access-token');
	res.setHeader('Access-Control-Allow-Headers', 'Content-type, X-access-token');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

server.set('secret', 'sercet__1199102__key');

server.use((req, res, next) => {
	if (req.originalUrl != '/setup' && req.originalUrl != '/' && req.originalUrl != '/login') {
		var token = req.headers['X-access-token'] || req.query.token;
		if (token) {
			jwt.verify(token, server.get('secret'), function (err, decoded) {
				if (err) {
					res.end('Invalid token');
				} else {
					req.user = decoded;
					next();
				}
			});
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
    database: DATA_BASE
});



sql.connect((err) => {
	if(err) throw err;
	server.listen(6060, (err) => {
		if(err) throw err;
		var dbConvert = `ALTER DATABASE ${DATA_BASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
		var user = 'CREATE TABLE IF NOT EXISTS user( email VARCHAR(50) UNIQUE CHECK (CHAR_LENGTH(email) >= 8), password VARCHAR(16),  CONSTRAINT strlen CHECK (length(mycolumn) > 2), id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)';
		var channel = 'CREATE TABLE IF NOT EXISTS channel( url VARCHAR(100) NOT NULL, provider VARCHAR(16) NOT NULL, id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)';
		var user_channel = 'CREATE TABLE IF NOT EXISTS user_channel( user_id INT NOT NULL, channel_id  INT NOT NULL, PRIMARY KEY(user_id, channel_id))';
		var feed = 'CREATE TABLE IF NOT EXISTS feed (title TEXT NOT NULL, link TEXT NOT NULL, create_date VARCHAR(60), content TEXT NOT NULL, id INT PRIMARY KEY AUTO_INCREMENT NOT NULL)';
		var channel_feed = 'CREATE TABLE IF NOT EXISTS channel_feed(channel_id INT NOT NULL, feed_id  INT NOT NULL, PRIMARY KEY(channel_id, feed_id))';
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
									list.map(item => feedParser(item, false));									
									setInterval(
										() => {
											list.map(item => feedParser(item, false));
										},
										1000*60*90); // 1.5 hours
								});
							});
						});
					});
				});
			});       
		});
	});
});
exports.sql = sql;
exports.server = server;
