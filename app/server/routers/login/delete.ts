import SessionTokenManager from '../../../core/session-token-manager';
import RouteConfiguration from '../../route-configuration';

const route: RouteConfiguration = {
    method: 'DELETE',
    path: '/login',
    auth: true,
    handler: async (req, res) => {
        await SessionTokenManager.invalidate(req.header('x-auth-token')!); // always defined, b/c auth is required
        res.send();
    }
};

export = route;
