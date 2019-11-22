import express from 'express';
import passport from 'passport';

async function handler(req: express.Request, res: express.Response): Promise<void> {
    // do nothing; logic is handled by the middleware
}

const middleware = [passport.authenticate('google', {session: false})];

export = {handler, middleware};
