var server = require('./server.js').server;
var SQL = require('./SqlAction.js');
var sql = require('./server.js').sql;

server.post('/setup', (req, res) => SQL.setup(req, res, sql));
server.post('/login', (req, res) => SQL.login(req, res, sql));

server.get('/user_channel', (req, res) => SQL.userChannel(req, res, sql));
server.post('/channel/create', (req, res) => SQL.channelCreate(req, res, sql));
server.put('/channel/:id', (req, res) => SQL.changeChannel(req, res, sql));
server.delete('/channel/:id', (req, res) => SQL.deleteChannel(req, res, sql));
server.get('/channel/:id', (req, res) => SQL.feedChannel(req, res, sql));

server.get('/user', (req, res) => {
	res.send(req.user);
});