import express from 'express';
import RouteConfiguration from '../../route-configuration';
import loginDelete from '../login/delete';
import loginPost from '../login/post';
import userPost from '../users/post';
import verificationGet from '../users/verification/get';
import verificationGetWithId from '../users/verification/get-with-id';
import verificationPost from '../users/verification/post';

const router = express.Router();

RouteConfiguration.addRoute(router, userPost);
RouteConfiguration.addRoute(router, loginPost);
RouteConfiguration.addRoute(router, loginDelete);
RouteConfiguration.addRoute(router, loginDelete);
RouteConfiguration.addRoute(router, verificationPost);
RouteConfiguration.addRoute(router, verificationGetWithId);
RouteConfiguration.addRoute(router, verificationGet);

export = router;
