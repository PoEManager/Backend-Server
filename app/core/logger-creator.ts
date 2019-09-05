import winston from 'winston';

const format = winston.format.printf(({level, message, timestamp, label}) => {
    // 18 is the length of a request id
    return `${timestamp} ${level.toUpperCase().padEnd(5, ' ')} ${label.padEnd(18, ' ')} ${message}`;
});

function makeNewDir(): string {
    const date = new Date();
    return `log-${date.getFullYear()}-${date.getMonth()}-${date.getDay()}-${date.getTime()}`;
}

const dir = makeNewDir();

function newLogger(label: string): winston.Logger {
    return winston.createLogger({
        format: winston.format.combine(winston.format.timestamp(), winston.format.label({label}), format),
        transports: [
            new winston.transports.File({filename: `logs/${dir}/error.log`, level: 'error'}),
            new winston.transports.File({filename: `logs/${dir}/log.log`}),
            new winston.transports.Console()
        ]
    });
}

export = {newLogger};
