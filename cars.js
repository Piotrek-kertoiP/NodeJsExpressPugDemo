var express = require('express');
var path = require('path');
var mysql = require('mysql');

var app = express();
app.use(express.urlencoded());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

var dbOptions = {
    host: 'localhost',
    user: 'user',
    password: 'userpass',
    database: 'userdb',
    port: 3306
}

var pool = mysql.createPool(dbOptions)

app.get('/', function (req, res) {
    console.log("Displaying start view")
    res.render('start');
});

app.get('/list', function (req, res) {
    console.log("Displaying car list view")
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log("Failed to connect with DB, err: " + err)
            return res.send(403, "Couldn't connect with DB");
        }
        // if you got a connection...
        conn.query('SELECT * FROM cars', function (err, carsList) {
            if (err) {
                conn.release();
                return res.send(500, "Got a connection to DB, but couldn't execute query");
            }
            res.render('list', {
                carsList: carsList
            });
            // CLOSE THE CONNECTION
            conn.release();
        });
    });
});

app.get('/add', function (req, res) {
    console.log("Displaying add view")
    res.render('add');
});

app.post('/add', function (req, res) {
    console.log("Adding a car:\n" + req.body)
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log("Failed to connect with DB, err: " + err)
            return res.send(403, "Couldn't connect with DB");
        }
        // if you got a connection...
        const car = {
            make: req.body.make,
            model: req.body.model,
            year: req.body.year,
            cubic_capacity: req.body.cubic_capacity,
            power: req.body.power
        };
        // note: doesn't work with polish characters
        let queryStr = 'INSERT INTO cars SET ?'
        conn.query(queryStr, car, function (err, rows) {
            if (err) {
                conn.release();
                console.log("Error when inserting car into table, err: " + err)
                res.render('add', { message: 'An error occured' });
                return res.send(500, "Got a connection to DB, but couldn't execute query");
            }
            console.log("Successfully added a car")
            res.render('add', {message: 'Data has been added'});
            // CLOSE THE CONNECTION
            conn.release();
        });
    });
});

app.get('/edit/(:id)', function (req, res) {
    let carId = req.params.id;
    console.log("Displaying edit view for car with id: " + carId)
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log("Failed to connect with DB, err: " + err)
            return res.send(403, "Couldn't connect with DB");
        }
        // if you got a connection...
        let queryStr = 'SELECT * FROM cars WHERE id=' + carId;
        conn.query(queryStr, function (err, rows) {
            if (err) {
                conn.release();
                console.log("Error when retrieving car to edit from DB, err: " + err)
                res.render('edit', {message: 'Wystąpił błąd'});
                return res.send(500, "Got a connection to DB, but couldn't execute query");
            }
            res.render('edit', {
                id: carId,
                make: rows.make,
                model: rows.model,
                year: rows.year,
                cubic_capacity: rows.cubic_capacity,
                power: rows.power
            });
            // CLOSE THE CONNECTION
            conn.release();
        });
    });
});

app.post('/edit/(:id)', function (req, res) {
    console.log(req.body)
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log("Failed to connect with DB, err: " + err)
            return res.send(403, "Couldn't connect with DB");
        }
        // if you got a connection...
        let carId = req.params.id;
        const car = {
            make: req.body.make,
            model: req.body.model,
            year: req.body.year,
            cubic_capacity: req.body.cubic_capacity,
            power: req.body.power
        };
        // note: doesn't work with polish characters
        let queryStr = 'UPDATE cars SET ? WHERE id=' + carId;
        conn.query(queryStr, car, function (err, rows) {
            if (err) {
                conn.release();
                console.log("Error when updating car in table, err: " + err)
                res.render('edit', {
                    id: carId,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    cubic_capacity: car.cubic_capacity,
                    power: car.power,
                    message: "An error occured"
                });
                return res.send(500, "Got a connection to DB, but couldn't execute query");
            }
            console.log("Successfully edited the car")
            res.render('edit', {
                id: carId,
                make: car.make,
                model: car.model,
                year: car.year,
                cubic_capacity: car.cubic_capacity,
                power: car.power,
                message: "Successfully edited car details"
            });
            // CLOSE THE CONNECTION
            conn.release();
        });
    });
});

app.get('/delete/:id', function (req, res) {
    var carId = req.params.id;
    console.log("Displaying delete view for car with id: " + carId)
    res.render('delete', {carId: carId});
});

app.post('/delete/:id', function (req, res) {
    let carId = req.params.id;
    console.log("Deleting car with id: " + carId)
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log("Failed to connect with DB, err: " + err)
            return res.send(403, "Couldn't connect with DB");
        }
        conn.query('DELETE FROM cars WHERE id=' + carId, function (err, rows) {
            if (err) {
                conn.release();
                console.log("Failed to delete car with id " + carId + ", error: " + err)
                var message = 'An error occured :(';
            } else {
                var message = 'Data has been deleted :)';
            }
            res.render('delete', {carId: carId, message: message});
            // CLOSE THE CONNECTION
            conn.release();
        });
    });
});

app.listen(3000);
