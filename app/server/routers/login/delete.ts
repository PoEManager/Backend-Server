import SessionTokenManager from '../../../core/session-token-manager';
import RouteConfiguration from '../../route-configuration';

const route: RouteConfiguration = {
    method: 'DELETE',
    path: '/login',
    auth: true,
    handler: async (req, res) => {
        req.locals.logger.info(`Logging out user with id ${req.locals.user.getId()}.`);
        await SessionTokenManager.invalidate(req.header('x-auth-token')!); // always defined, b/c auth is required
        req.locals.logger.info(`Logout successful.`);
        res.send();
    }
};

export = route;
