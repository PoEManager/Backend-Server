import JWTManager from '../../../core/jwt-manager';
import RouteConfiguration from '../../route-configuration';

const route: RouteConfiguration = {
    method: 'DELETE',
    path: '/login',
    auth: true,
    handler: async (req, res) => {
        await JWTManager.invalidateJWT(req.header('x-auth-token')!); // always defined, b/c auth is required
        res.send();
    }
};

export = route;
