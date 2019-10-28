import express from 'express';
import _ from 'lodash';
import User from '../../../model/user';
import UserManager from '../../../model/user-manager';
import errors from '../../errors';

const paramMap: {[key: string]: number} = {
    nickname: User.QueryData.NICKNAME,
    createdTime: User.QueryData.CREATED_TIME
};

// Technically not required, if the keys and values are always the same.
// However, this allows for changes in User.query() without changing the REST interface
// Also, this decouples the model and the interface.
const resultMap: {[key: string]: string} = {
    nickname: 'nickname',
    createdTime: 'createdTime'
};

function urlQueryToUserQueryParams(params: any): User.QueryData[] {
    return _.map(Object.keys(params), key => paramMap[key]);
}

interface ITemporaryBody {
    [key: string]: string | Date | number | undefined;
}

function resultToBodyObject(result: User.IQueryResult): ITemporaryBody {
    return _.mapKeys(result, (value, key) => resultMap[key]);
}

// transforms the body returned by resultToBodyObject() into one that can be send as result
function bodyTransformer(inBody: ITemporaryBody): {[key: string]: string | number} {
    const ret: {[key: string]: string | number} = {};

    for (const key in inBody) {
        if (key) {
            const object = inBody[key];

            if (object !== undefined) { // filters out undefined objects
                if (object instanceof Date) {
                    ret[key] = object.toISOString();
                } else { // case for strings + numbers
                    ret[key] = object;
                }
            }
        }
    }

    return ret;
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
    const resultBody = bodyTransformer(resultToBodyObject(result));

    req.locals.logger.info('Query successful.');
    res.send(resultBody);
}

export = handler;
