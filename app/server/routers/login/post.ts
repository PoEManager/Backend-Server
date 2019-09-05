import Joi from '@hapi/joi';
import SessionTokenManager from '../../../core/session-token-manager';
import errors from '../../../model/errors';
import UserManager from '../../../model/user-manager';
import RouteConfiguration from '../../route-configuration';

const route: RouteConfiguration = {
    method: 'POST',
    path: '/login',
    bodySchema: Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    }),
    handler: async (req, res) => {
        const user = await UserManager.searchForUserWithEmail(req.body.email);
        const login = await user.getDefaultLogin();
        const password = await login.getPassword();

        if (await password.compareTo(req.body.password)) {
            res.send({token: await SessionTokenManager.create(user)});
        } else {
            throw new errors.InvalidCredentialsError();
        }
    }
};

export = route;
