import User from '../model/user';
import winston from 'winston'

declare module 'express-serve-static-core' {
     interface Request {
        user: User;
        locals: {
            requestId: string;
            logger: winston.Logger;
            startTime: Date;
        }
    }
}
