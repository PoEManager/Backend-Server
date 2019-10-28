import express from 'express';
import AvatarManager from '../../../model/avatar-manager';
import UserManager from '../../../model/user-manager';
import errors from '../../errors';

async function handler(req: express.Request, res: express.Response) {
    req.locals.logger.info(`Retrieving avatar of user with ID ${req.params.id}.`);

    const id = parseInt(req.params.id);

    if (isNaN(id) || id.toString() !== req.params.id) {
        req.locals.logger.info(`'${req.params.id}' is an invalid ID.`);
        throw new errors.InvalidParamError(req.params.id);
    }

    const user = await UserManager.get(id);

    const avatar = await AvatarManager.getAvatarData(user);

    req.locals.logger.info('Avatar retrieval done.');

    res.writeHead(200, {'Content-Type': 'image/jpg'});
    res.end(avatar.toString('Base64'), 'Base64');
}

export = handler;
