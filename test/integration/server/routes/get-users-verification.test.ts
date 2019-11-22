import supertest from 'supertest';
import DatabaseConnection from '../../../../app/core/database-connection';
import SessionTokenManager from '../../../../app/core/session-token-manager';
import errors from '../../../../app/model/errors';
import UserManager from '../../../../app/model/user-manager';
import WalletRestrictions from '../../../../app/model/wallet-restrictions';
import { NotVerifiedError } from '../../../../app/server/errors';
import server from '../../../../app/server/server';
import routeTestUtils from './route-test-utils';

let agent: supertest.SuperTest<supertest.Test>;

describe('server', () => {
    describe('GET /users/walletRestrictions', () => {
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

        it('should return 200 and the correct value, if the request was valid', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await agent
                .get('/api/users/verification')
                .set('Authorization', `bearer ${await SessionTokenManager.create(user)}`)
                .expect(200, {verified: await user.isVerified()});
        });

        it('should return 404 and no body, if the authentication failed', async () => {
            await routeTestUtils.testAuthMiddlewarePresence(agent.get('/api/users/verification'));
        });
    });
});
