const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        // if log folder does not exists
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
        };
        // appendFile
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem);

    } catch (err) {
        console.log(err);
    };
};

const logger = (req, res, next) => {
    // Add a condition if you want to modify the logs instead of logging everything
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');
    console.log(req.method, req.path);
    next();
};

module.exports = { logEvents, logger };