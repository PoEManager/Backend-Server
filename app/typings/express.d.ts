import User from '../model/user';
import winston from 'winston'

declare module 'express-serve-static-core' {
     interface Request {
        locals: {
            requestId: string;
            user: User;
            logger: winston.Logger;
            startTime: Date;
        }
    }
}
