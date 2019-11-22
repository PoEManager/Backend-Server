import base64url from 'base64-url';
import supertest from 'supertest';
import DatabaseConnection from '../../../../app/core/database-connection';
import SessionTokenManager from '../../../../app/core/session-token-manager';
import errors from '../../../../app/model/errors';
import Password from '../../../../app/model/password';
import UserManager from '../../../../app/model/user-manager';
import WalletRestrictions from '../../../../app/model/wallet-restrictions';
import { NotVerifiedError } from '../../../../app/server/errors';
import server from '../../../../app/server/server';
import routeTestUtils from './route-test-utils';

let agent: supertest.SuperTest<supertest.Test>;

describe('server', () => {
    describe('GET /users/verification/:id', () => {
        beforeAll(done => {
            server.start({
                disableLogging: true,
                doneCb: () => {
                    agent = supertest.agent(server.getServer());
                    done();
                },
                testMode: false
            });
        });

        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
            await server.stop();
        });

        it('should return 200 and verify the user, if the request was valid', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await agent
                .get(`/api/users/verification/${base64url.escape((await user.getChangeUID())!)}`)
                .expect(200);

            await expect(user.isVerified()).resolves.toBeTruthy();
        });

        it('should return 200 and invalidate user\'s session, if the request changed the E-Mail', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await UserManager.validateChange((await user.getChangeUID())!);
            await SessionTokenManager.create(user);
            await user.updateEMail('test2@test.com');

            await agent
                .get(`/api/users/verification/${base64url.escape((await user.getChangeUID())!)}`)
                .expect(200);

            await expect(user.getEmail()).resolves.toBe('test2@test.com');
            await expect(user.getSessionID()).resolves.toBeNull();
        });

        it('should return 200 and invalidate user\'s session, if the request changed the password', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await UserManager.validateChange((await user.getChangeUID())!);
            await SessionTokenManager.create(user);
            const defaultLogin = await user.getDefaultLogin();
            const password = await Password.encryptPassword('new-password');
            await defaultLogin.updatePassword(password);

            await agent
                .get(`/api/users/verification/${base64url.escape((await user.getChangeUID())!)}`)
                .expect(200);

            await expect(defaultLogin.getPassword()).resolves.toMatchObject(password);
            await expect(user.getSessionID()).resolves.toBeNull();
        });

        it('should return 404 and no body, if the change ID is invalid', async () => {
            await agent
                .get('/api/users/verification/abc')
                .expect(404, new errors.InvalidChangeIDError('abc=').asRESTError());
        });
    });
});
