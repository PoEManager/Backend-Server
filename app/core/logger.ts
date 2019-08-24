import winston from 'winston';

const format = winston.format.printf(({level, message, timestamp}) => {
    return `${timestamp} ${level.toUpperCase().padEnd(5, ' ')} ${message}`;
});

function makeNewDir(): string {
    const date = new Date();
    return `log-${date.getFullYear()}-${date.getMonth()}-${date.getDay()}-${date.getTime()}`;
}

const dir = makeNewDir();

const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), format),
    transports: [
        new winston.transports.File({filename: `logs/${dir}/error.log`, level: 'error'}),
        new winston.transports.File({filename: `logs/${dir}/log.log`}),
        new winston.transports.Console()
    ]
});

export = logger;
