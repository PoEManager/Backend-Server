import express from 'express';
import RouteConfiguration from '../../route-configuration';
import loginDelete from '../login/delete';
import loginPost from '../login/post';
import userPost from '../users/post';

const router = express.Router();

RouteConfiguration.addRoute(router, userPost);
RouteConfiguration.addRoute(router, loginPost);
RouteConfiguration.addRoute(router, loginDelete);

export = router;
