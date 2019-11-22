import supertest from 'supertest';
import DatabaseConnection from '../../../../app/core/database-connection';
import errors from '../../../../app/model/errors';
import server from '../../../../app/server/server';

let agent: supertest.SuperTest<supertest.Test>;

describe('server', () => {
    describe('POST /users', () => {
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
            await agent
                .post('/api/users')
                .send({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        password: 'password'
                    }
                })
                .expect(200, {});
        });

        it('should return 400 and an error, if the nickname was invalid', async () => {
            await agent
                .post('/api/users')
                .send({
                    nickname: '$invalid',
                    loginData: {
                        email: 'test@test.com',
                        password: 'password'
                    }
                })
                .expect(400, new errors.InvalidNicknameError('$invalid').asRESTError());
        });

        it('should return 400 and an error, if the E-Mail was invalid', async () => {
            await agent
                .post('/api/users')
                .send({
                    nickname: 'test123',
                    loginData: {
                        email: 'test',
                        password: 'password'
                    }
                })
                .expect(400, new errors.InvalidEmailError('test').asRESTError());
        });

        it('should return 409 and an error, if the E-Mail already exists', async () => {
            await agent
                .post('/api/users')
                .send({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        password: 'password'
                    }
                })
                .expect(200, {});

            await agent
                .post('/api/users')
                .send({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        password: 'password'
                    }
                })
                .expect(409, new errors.DuplicateEmailError('test@test.com').asRESTError());
        });
    });
});
