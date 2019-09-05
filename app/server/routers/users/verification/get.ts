import express from 'express';
import User from '../../../../model/user';
import RouteConfiguration from '../../../route-configuration';
import verificationPath from './verification-path';

const route: RouteConfiguration = {
    method: 'GET',
    path: `/${verificationPath}`,
    auth: true,
    handler
};

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const verified = await req.locals.user.isVerified();
    res.send({verified});
}

export = route;
