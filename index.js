var parser = require('rss-parser');
var server = require('./server.js').server;
var SQL = require('./SqlAction.js');


server.post('/setup', (req, res) => SQL.setup(req, res))
server.post('/login', (req, res) => SQL.login(req, res))

server.get('/user_channel', (req, res) => SQL.userChannel(req, res))
server.post('/channel/create', (req, res) => SQL.channelCreate(req, res));
server.put('/channel/:id', (req, res) => SQL.changeChannel(req, res));
server.delete('/channel/:id', (req, res) => SQL.deleteChannel(req, res))
// server.get('/channel', (req, res) => SQL.allChannel(req, res));

server.get('/user', (req, res) => {
    res.send(req.user);
})

// server.get('/users', (req, res) => {
//     sql.query('SELECT * FROM user',
//         (err, result) => {
//             if (err) res.send(err);
//             res.send(result);
//         });
// })

// server.get('/', (req, res) => {
//     console.log(feedParser('http://feeds.reuters.com/reuters/topNews'));
//     res.send('');
//     // res.end()
// })