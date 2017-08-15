var express = require('express');
var bodyParser = require('body-parser');
var server = express();
var mysql = require('mysql');

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    urlencoded: true
}));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1199102gosha",
    database: "sqlbase"
})

con.connect((err)=> {
    if(err) throw err;
    server.listen(6060, (err)=>{
        if(err) throw err;
        console.log('Connect')
        // var data = [
        //     ['John', 'Highway 71'],
        //     ['Peter', 'Lowstreet 4'],
        //     ['Amy', 'Apple st 652'],
        //     ['Hannah', 'Mountain 21'],
        //     ['Michael', 'Valley 345'],
        //     ['Sandy', 'Ocean blvd 2'],
        //     ['Betty', 'Green Grass 1'],
        //     ['Richard', 'Sky st 331'],
        //     ['Susan', 'One way 98'],
        //     ['Vicky', 'Yellow Garden 2'],
        //     ['Ben', 'Park Lane 38'],
        //     ['William', 'Central st 954'],
        //     ['Chuck', 'Main Road 989'],
        //     ['Viola', 'Sideway 1633']
        // ];
        // con.query('INSERT INTO user (email, password) VALUES ?',
        // [data],
        // (err, result) => {
        //     if (err) throw err;
        //     console.log(result);
        // })
    })
})
server.get('/add/:table', (req, res) => {
    var data = [
        ['John', 'Highway 71'],
        ['Peter', 'Lowstreet 4'],
        ['Amy', 'Apple st 652'],
        ['Hannah', 'Mountain 21'],
        ['Michael', 'Valley 345'],
        ['Sandy', 'Ocean blvd 2'],
        ['Betty', 'Green Grass 1'],
        ['Richard', 'Sky st 331'],
        ['Susan', 'One way 98'],
        ['Vicky', 'Yellow Garden 2'],
        ['Ben', 'Park Lane 38'],
        ['William', 'Central st 954'],
        ['Chuck', 'Main Road 989'],
        ['Viola', 'Sideway 1633']
    ];
    con.query(`INSERT INTO ${req.params.table} (email, password) VALUES ?`,
    [data],
    (err, result) => {
        if(err) res.send(err)
        res.send(result)
    })
})
server.get('/:table', (req, res) => {
    con.query(`SELECT * FROM ${req.params.table}`, (err, result) => {
        if(err) throw err;
        res.send(result);
    })
})

server.get('/:table/array', (req, res) => {
    var arr = [];
    con.query(`ALTER TABLET ${req.params.table} ADD COLUMN values()`,
    [arr],
    (err, result) => {
        if (err) throw err;
        res.send(result);
    })
})


server.get('/get', (req, res) => {
    var email = 'Michael';
    var password = 'One way 98';
    con.query('SELECT * FROM user WHERE email=? OR password=?',
        [email, password],
        (err, result) => {
        if (err) throw err;
        res.send(result);
    })
})

server.get('/sort', (req, res) => {
    var email = 'Michael';
    var password = 'One way 98';
    con.query('SELECT * FROM user ORDER BY email',
        (err, result) => {
            if (err) throw err;
            res.send(result);
        })
})

server.get('/sort/desc', (req, res) => {
    var email = 'Michael';
    var password = 'One way 98';
    con.query('SELECT * FROM user ORDER BY email DESC',
        (err, result) => {
            if (err) throw err;
            res.send(result);
        })
})
server.delete('/list/:email', (req, res) => {
    var email = req.params.email;
    con.query(`DELETE FROM user WHERE email="${email}"`,
    [email],
    (err, result)=> {
        if(err) throw err;
        res.send(result);
    })
})

server.delete('/deleeeete/:table', (req, res) => {
    var item = req.params.table;
    con.query(`DROP TABLE ${item}`,
        (err, result) => {
            if (err) throw err;
            res.send(result);
        })
})

server.get('/creaaate/:table', (req, res) => {
    var item = req.params.table;
    con.query(
        `CREATE TABLE ${item}
         (id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
         email VARCHAR(255) NOT NULL,
         password VARCHAR(255) NOT NULL
         )`,
        (err)=> {
        if(err) res.send(err);
        res.send(`Create ${item}`);
    })
})  
