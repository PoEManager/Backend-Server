import User from "../model/user";

declare module 'express-serve-static-core' {
     interface Request {
        locals: {
            requestId: string;
            user: User;
        }
    }
}
