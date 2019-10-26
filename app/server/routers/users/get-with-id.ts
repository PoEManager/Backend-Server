import Joi from '@hapi/joi';
import express from 'express';
import _ from 'lodash';
import User from '../../../model/user';
import UserManager from '../../../model/user-manager';
import errors from '../../errors';
import RouteConfiguration from '../../route-configuration';

const paramMap: {[key: string]: number} = {
    nickname: User.QueryData.NICKNAME
};

// Technically not required, if the keys and values are always the same.
// However, this allows for changes in User.query() without changing the REST interface
// Also, this decouples the model and the interface.
const resultMap: {[key: string]: string} = {
    nickname: 'nickname'
};

// todo query verification
// todo param verification

const route: RouteConfiguration = {
    method: 'GET',
    path: '/users/:id',
    querySchema: Joi.object().unknown(true), // Joi.string().allow(Object.keys(paramMap)
    handler
};

function urlQueryToUserQueryParams(params: any): User.QueryData[] {
    return _.map(Object.keys(params), key => paramMap[key]);
}

function resultToBodyObject(result: User.IQueryResult): {[key: string]: string | number | undefined} {
    return _.mapKeys(result, (value, key) => resultMap[key]);
}

async function handler(req: express.Request, res: express.Response): Promise<void> {
    req.locals.logger.info(`Query data for user with ID '${req.params.id}'.`);

    const id = parseInt(req.params.id);

    if (isNaN(id) || id.toString() !== req.params.id) {
        req.locals.logger.info(`'${req.params.id}' is an invalid ID.`);
        throw new errors.InvalidParamError(req.params.id);
    }

    const user = await UserManager.get(id);
    const queryParams = urlQueryToUserQueryParams(req.query);

    const result = await user.query(queryParams);
    const resultBody = resultToBodyObject(result);

    req.locals.logger.info('Query successful.');
    res.send(resultBody);
}

export = route;
