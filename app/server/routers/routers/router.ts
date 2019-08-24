import express from 'express';
import RouteConfiguration from '../../route-configuration';
import userPost from '../users/post';

const router = express.Router();

RouteConfiguration.addRoute(router, userPost);

export = router;
