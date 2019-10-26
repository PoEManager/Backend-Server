import express from 'express';
import RouteConfiguration from '../../route-configuration';
import loginDelete from '../login/delete';
import loginPost from '../login/post';
import authDefaultEmailPut from '../users/auth/default/email/put';
import authDefaultPasswordPut from '../users/auth/default/password/put';
import userPost from '../users/post';
import verificationGet from '../users/verification/get';
import verificationGetWithId from '../users/verification/get-with-id';
import verificationPost from '../users/verification/post';

const router = express.Router();

RouteConfiguration.addRoute(router, userPost); // POST /users
RouteConfiguration.addRoute(router, loginPost); // POST /login
RouteConfiguration.addRoute(router, loginDelete); // DELETE /login
RouteConfiguration.addRoute(router, verificationPost); // POST /${verificationPath}
RouteConfiguration.addRoute(router, verificationGetWithId); // GET /${verificationPath}/:changeId
RouteConfiguration.addRoute(router, verificationGet); // /${verificationPath}
RouteConfiguration.addRoute(router, authDefaultEmailPut); // PUT /users/auth/default/email
RouteConfiguration.addRoute(router, authDefaultPasswordPut); // PUT /users/auth/default/password

export = router;
