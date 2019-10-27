/*
import express from 'express';
import _ from 'lodash';
import config from '../../../core/config';
import RouteConfiguration from '../../route-configuration';

const route: RouteConfiguration = {
    method: 'GET',
    path: '/users',
    auth: true,
    handler
};

async function handler(req: express.Request, res: express.Response): Promise<void> {
    const params = Object.keys(req.query);

    res.redirect(`/${config.basic.basePath}/users/${req.locals.user.getId()}?${params.join('&')}`);
}

export = route;
*/
