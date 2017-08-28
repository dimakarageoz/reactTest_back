var jwt = require('jsonwebtoken');
var parser = require('rss-parser');


const feedFilter = (channel) => {
	var sql = require('./server.js').sql;
	sql.query('SELECT create_date, id FROM feed INNER JOIN channel_feed ON channel_feed.channel_id=? AND channel_feed.feed_id=feed.id', [channel.id], (err, feeds) => {
		if (err) console.log(err);
		feeds.map(item=> {
			if(((Date.now() - Date.parse(item.create_date))/1000) > 60*60*12){  // filter start every 12 hours
				sql.query('DELETE f, c_f FROM feed f JOIN channel_feed c_f ON c_f.feed_id=f.id AND f.id=?',
					[item.id],
					(err)=>{
						if (err) console.log(err);
					});
			}
		});
	});
};

const feedParser = (channel, first) => {
	var sql = require('./server.js').sql;
	sql.query('SELECT * FROM feed JOIN channel_feed ON channel_feed.channel_id=?', [channel.id], (err, res)=>{
		if(err) throw err;
		parser.parseURL(channel.url, (err, parsed) => {
			if(err) return;
			res = res.map(item => item.link);
			let feeds;
			feeds = (res.length > 0 && !first) ? parsed.feed.entries.filter(entry => res.indexOf(entry.link) === -1)
				.map(entry => [
					entry.title,
					entry.contentSnippet,
					entry.link,
					entry.isoDate
				])
				: parsed.feed.entries.map(entry => [
					entry.title,
					entry.contentSnippet,
					entry.link,
					entry.isoDate
				]);
			if(feeds.length === 0) {
				feedFilter(channel);
				return ;
			}
			sql.query('INSERT INTO feed (title, content, link, create_date) VALUES ?',
				[feeds],
				(err) => {
					if(err) console.log(err);
					else {
						let feedUrls = feeds.map(item => item[2]); //  <= feeds.link
						sql.query('SELECT * FROM feed WHERE link IN (?)',
							[feedUrls],
							(err, list) => {
								if(err) console.log(err);
								else {
									let chan_feed = list.map(item => ([channel.id, item.id]));
									sql.query('INSERT INTO channel_feed (channel_id, feed_id) VALUES ?',
										[chan_feed],
										(err) => {
											if(err) console.log(err);
											feedFilter(channel);
										});
								}
							});
					}  
				});
		});
	});
};

const globalDeleteChannel = (req, res, chan_id, sql) => {
	sql.query('SELECT feed_id FROM channel_feed WHERE channel_id=?',
		[chan_id],
		(err, list) => {
			if(err) res.status(500).json({err});
			list = list.map(item => item.feed_id);
			sql.query('DELETE c_f, f FROM channel_feed c_f JOIN feed f ON c_f.feed_id = f.id AND f.id IN (?)',
				[list],
				(err) => {
					if(err) res.status(500).json({err});
					sql.query('DELETE FROM channel WHERE id=?',
						[chan_id],
						(err) => {
							if (err) res.status(500).json({err});
							res.status(200).json({status: 'OK'});
						});
				});
		});
};

exports.feedParser = feedParser;

const loginToken = (req, res, sql) => {
	var server = require('./server.js').server;
	sql.query('SELECT * FROM user WHERE email = ? AND password = ?',
		[req.body.email, req.body.password],
		(err, result) => {
			if (err) res.status(500).json({ err });
			if (result[0]) {
				var token = jwt.sign(result[0], server.get('secret'));
				res.status(200).json({token, email: req.body.email});
			}
		});
};

exports.login = (req, res, sql) => {
	loginToken(req,res,sql);
};

exports.setup = (req, res, sql) => {
	if (req.body.email < 8 || req.body.password < 8 || req.body.password !== req.body.confirm){
		res.status(400).json({error:'Bad request'});
	}
	sql.query(`INSERT INTO user (email, password) VALUES ('${req.body.email}','${req.body.password}')`,
		(err) => {
			if (err) res.status(400).json({error:'Something failed'});
			loginToken(req,res,sql);
		});
};

exports.feedChannel = (req, res, sql) => {
	sql.query('SELECT title, content, link, id FROM feed JOIN channel_feed WHERE channel_feed.channel_id=? AND feed.id=channel_feed.feed_id',
		[req.params.id],	
		(err, feeds) => {
			// res.status(200).json(feeds);
			res.send(feeds);
		});
};
exports.userChannel = (req, res, sql) => {
	sql.query('SELECT * FROM user_channel WHERE user_id=?',
		[req.user.id],
		(err, result) => {
			if (err) res.status(500).json({ err });
			var list = result.map(item => item.channel_id);
			if (list.length > 0) {
				sql.query('SELECT * FROM channel WHERE id IN (?)',
					[list],
					(err, chan) => {
						if (err) res.status(500).json({ err });
						res.send(chan);
					});
			}
			// }
			// res.status(200).json(result);
		});
};

exports.channelCreate = (req, res, sql) => {
	sql.query('SELECT * FROM channel WHERE url=? AND provider=?',
		[req.body.url, req.body.provider],
		(err, ans) => {
			if (err) res.status(500).json({err: 'Server error'});
			if(ans.length === 0 ) {
				sql.query('INSERT INTO channel (url, provider) VALUES (?, ?)',
					[req.body.url, req.body.provider],
					(err) => {
						if (err) res.status(500).json({ err: 'Server error' });
						sql.query(`SELECT * FROM channel WHERE url='${req.body.url}'`,
							(err, list) => {
								if (err) res.status(500).json({ err: 'Server error' });
								else {
									sql.query('INSERT INTO user_channel (user_id, channel_id) VALUES (?, ?)',
										[req.user.id, list[0].id],
										(err) => {
											if (err) res.status(500).json({ err: 'Server error' });
											res.status(200).json({ status: 'Channel"s added correct' });
											feedParser(list[0], true);
										}
									);
								}
							}
						);
					});
			} else {
				sql.query('INSERT INTO user_channel (user_id, channel_id) VALUES (?, ?)',
					[req.user.id, ans[0].id],
					(err, result) => {
						if (err) res.send(err);
						res.send(result);
					}
				);
			}
		});
};

exports.changeChannel = (req, res, sql) => {
	if (req.body.url) {
		sql.query('UPDATE channel SET url=? WHERE id=?',
			[req.body.url, req.params.id],
			(err, result) => {
				if (err) res.status(500).json({ err });
				res.send(result);
			});
	}
	if (req.body.provider) {
		sql.query('UPDATE channel SET provider=? WHERE id=?',
			[req.body.provider, req.params.id],
			(err, result) => {
				if (err) res.status(400).json({err: 'Bad request'});
				res.send(result);
			});
	}
	if (!req.body.provider && !req.body.url)
		res.status(400).json({err:'Invalid query'});
};

exports.deleteChannel = (req, res, sql) => {
	sql.query(`DELETE FROM user_channel WHERE user_id=${req.user.id} AND channel_id=${req.params.id}`,
		(err) => {
			if (err) res.status(500).json({ err });
			sql.query('SELECT * FROM user_channel WHERE channel_id=?',
				[req.params.id],
				(err, chan) => {
					if(err) res.status(500).json({err});
					if(chan.length > 0) {
						res.send({status: 'Channel was removed correct'});
					} else {
						globalDeleteChannel(req, res, req.params.id, sql);
					}
				});
		});
};
