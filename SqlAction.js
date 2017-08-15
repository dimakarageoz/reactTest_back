var jwt = require('jsonwebtoken');
var parser = require('rss-parser');
var sql = require('./server.js').sql;
var server = require('./server.js').server;


const feedParser = (channel) => {
// var sql = require('./server.js').sql;
sql.query('SELECT * FROM feed JOIN channel_feed ON channel_feed.channel_id=?', [channel.id], (err, res)=>{
    if(err) throw err;
        parser.parseURL(channel.url, (err, parsed) => {
            if(err) throw err;

            res = res.map(item => item.link);
            
            let feeds = parsed.feed.entries.filter(entry => res.indexOf(entry.link) === -1)
            .map(entry => [
                entry.title,
                entry.contentSnippet,
                entry.link,
                entry.isoDate
            ])
            if(feeds.length === 0) {
                return ;
            }
            sql.query('INSERT INTO feed (title, content, link, create_date) VALUES ?',
            [feeds],
            (err, res) => {
                if(err) throw err
                else {
                    let feedUrls = feeds.map(item => item[2]); //  <= feeds.link
                    sql.query('SELECT * FROM feed WHERE link IN (?)',
                    [feedUrls],
                    (err, list) => {
                        if(err) console.log(err)
                        else {
                            let chan_feed = list.map(item => ([channel.id, item.id]));
                            sql.query('INSERT INTO channel_feed (channel_id, feed_id) VALUES ?',
                            [chan_feed],
                            (err) => {
                                if(err) console.log(err);
                                feedFilter();
                            })
                        }
                    })
                }  
            })
        })
    })
}

const globalDeleteChannel = (req, res, chan_id) => {
    sql.query('SELECT feed_id FROM channel_feed WHERE channel_id=?',
    [chan_id],
    (err, list) => {
        if(err) res.send(err)
        list = list.map(item => item.feed_id);
        sql.query('DELETE FROM channel_feed INNER JOIN  feed ON channel_feed.feed_id = feed.id WHERE feed.id=?',
        [list],
        (err) => {
            if(err) res.send(err)
            sql.query('DELETE FROM channel WHERE id=?',
            [chan_id],
            (err) => {
                if(err) res.send(err);
                res.sendStatus(200);
            })
        })
    })
}

exports.feedParser = feedParser;

exports.login = (req, res) => {
    sql.query(`SELECT * FROM user WHERE email = ? AND password = ?`,
        [req.body.email, req.body.password],
        (err, result) => {
            if (err) res.send(err);
            if (result[0]) {
                var token = jwt.sign(result[0], server.get('secret'));
                res.send(token);
            } else res.send('User not found');
        });

}

exports.setup = (req, res) => {
    sql.query(`INSERT INTO user (email, password) VALUES ('${req.body.email}','${req.body.password}')`,
        (err, result) => {
            if (err) res.send(err);
            res.send(result);
        });
}

exports.userChannel = (req, res) =>{
    var sql = require('./server.js').sql;
    sql.query('SELECT * FROM user_channel WHERE user_id=?',
        [req.user.id],
        (err, result) => {
            if (err) res.send(err);
            var list = result.map(item => item.channel_id);
            sql.query('SELECT * FROM channel WHERE id IN (?)',
                [list],
                (err, chan) => {
                    if (err) res.send(err);
                    res.send(chan);
                })
    });
}

exports.channelCreate = (req, res) => {
    sql.query('SELECT * FROM channel WHERE url=? AND provider=?',
        [req.body.url, req.body.provider],
        (err, ans) => {
            if (err) res.send(err);
            if(ans.length === 0 ) {
                sql.query('INSERT INTO channel (url, provider) VALUES (?, ?)',
                    [req.body.url, req.body.provider],
                    (err, result) => {
                        if (err) res.send(err);
                        sql.query(`SELECT id from channel WHERE url='${req.body.url}'`,
                            (err, list) => {
                                if (err) res.send(err);
                                else {
                                    console.log(list[0]);
                                    sql.query(`INSERT INTO user_channel (user_id, channel_id) VALUES (?, ?)`,
                                        [req.user.id, list[0].id],
                                        (err, result) => {
                                            if (err) res.send(err);
                                            feedParser(list[0])
                                        }
                                    )
                                }
                            }
                        )
                });
            } else {
                sql.query(`INSERT INTO user_channel (user_id, channel_id) VALUES (?, ?)`,
                    [req.user.id, ans[0].id],
                    (err, result) => {
                        if (err) res.send(err);
                        res.send(result);
                    }
                )
            }
    })
};

exports.changeChannel = (req, res) => {
    if (req.body.url) {
        sql.query('UPDATE channel SET url=? WHERE id=?',
            [req.body.url, req.params.id],
            (err, result) => {
                if (err) res.send(err);
                res.send(result);
            });
    }
    if (req.body.provider) {
        console.log('in')
        sql.query('UPDATE channel SET provider=? WHERE id=?',
            [req.body.provider, req.params.id],
            (err, result) => {
                if (err) res.send(err);
                res.send(result);
            });
    }
    if (!req.body.provider && !req.body.url)
        res.end('Invalid query')
}

exports.allChannel = (req, res) => {
    sql.query('SELECT * FROM channel',
        (err, result) => {
            if (err) res.send(err);
            res.send(result);
        });
};

exports.deleteChannel = (req, res) => {
    sql.query('DELETE FROM user_channel WHERE user_id=? AND channel_id=?',
    [[req.user.id, res.params.id]],
    (err) => {
        if(err) res.send(err)
        sql.query('SELECT * FROM user_channel WHERE channel_id=?',
        [res.params.id],
        (err, chan) => {
            if(err) res.send(err);
            if(chan.length > 0) {
                res.sendStatus(200);
            } else {
                globalDeleteChannel(req, res, res.params.id)
            }
        })
    })
}
