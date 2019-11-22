import supertest from 'supertest';
import DatabaseConnection from '../../../../app/core/database-connection';
import SessionTokenManager from '../../../../app/core/session-token-manager';
import errors from '../../../../app/model/errors';
import UserManager from '../../../../app/model/user-manager';
import server from '../../../../app/server/server';

let agent: supertest.SuperTest<supertest.Test>;

describe('server', () => {
    describe('POST /login/default', () => {
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

        it('should return 200 and no body, if the request was valid', async () => {
            const user = await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await agent
                .post('/api/login/default')
                .auth('test@test.com', 'password')
                .expect(200, {
                    token: await SessionTokenManager.create(user)
                });
        });

        it('should return 404 and no body, if the authentication failed (wrong E-Mail)', async () => {
            await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await agent
                .post('/api/login/default')
                .auth('abc', 'password')
                .expect(404, new errors.InvalidCredentialsError().asRESTError());
        });

        it('should return 404 and no body, if the authentication failed (wrong password)', async () => {
            await UserManager.createWithDefaultLogin({
                nickname: 'test123',
                loginData: {
                    email: 'test@test.com',
                    unencryptedPassword: 'password'
                }
            });

            await agent
                .post('/api/login/default')
                .auth('test@test.com', 'wrong')
                .expect(404, new errors.InvalidCredentialsError().asRESTError());
        });
    });
});
