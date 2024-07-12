require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3500;

connectDB();

// define the middlewares
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/', express.static(path.join(__dirname, 'public')));


// define the routes
app.use('/', require('./routes/root'));
// users endpoint
app.use('/users', require('./routes/userRoutes'))

// serve the 404 file to any other routes that's not define.
app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found.' })
    } else {
        res.type('txt').send('404 Not Found.')
    };
});

// middleware error handler
app.use(errorHandler)

// once connection to mongoDB is established listen to port
mongoose.connection.once('open', () => {
    console.log('Connected to mongoDB!')
    // listen to port
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// catches error when failed connecting to mongoDB
mongoose.connection.on('error', (err) => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
});