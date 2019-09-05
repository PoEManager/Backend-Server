import base64url from 'base64-url';
import express from 'express';
import UserManager from '../../../../model/user-manager';
import RouteConfiguration from '../../../route-configuration';
import verificationPath from './verification-path';

const route: RouteConfiguration = {
    method: 'GET',
    path: `/${verificationPath}/:changeId`,
    handler
};

async function handler(req: express.Request, res: express.Response): Promise<void> {
    await UserManager.validateChange(base64url.unescape(req.params.changeId));
    res.send();
}

export = route;
