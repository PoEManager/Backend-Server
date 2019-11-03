import express from 'express';
import passport from 'passport';

async function handler(req: express.Request, res: express.Response): Promise<void> {

}

const middleware = [passport.authenticate('google', {session: false})];

export = {handler, middleware};
