import jwt from 'jsonwebtoken';
import config from '../../../app/core/config';
import DatabaseConnection from '../../../app/core/database-connection';
import errors from '../../../app/core/errors';
import JwtManager from '../../../app/core/jwt-manager';
import User from '../../../app/model/user';
import UserManager from '../../../app/model/user-manager';

describe('core', () => {
    describe('jwt-manager.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
        });

        describe('createJWT()', () => {
            it('should correctly generate a JWT for a user', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(JwtManager.createJWT(user)).resolves.toBeDefined();
            });
        });

        describe('verifyJWT()', () => {
            it('should correctly verify a JWT for an existing user', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await JwtManager.createJWT(user);
                const verifiedUser = await JwtManager.verifyJWT(token);
                expect(verifiedUser.getId()).toBe(user.getId());
            });

            it('should throw if an invalid JWT is passed', async () => {
                await expect(JwtManager.verifyJWT('abcd')).rejects.toMatchObject({data: {token: 'abcd'}});
            });

            it('should throw if a JWT with invalid payload is passed (missing user ID)', async () => {
                const token = jwt.sign({
                    jwtId: 12345
                }, config.security.jwt.secret);

                await expect(JwtManager.verifyJWT(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT with invalid payload is passed (missing JWT ID)', async () => {
                const token = jwt.sign({
                    userId: 12345
                }, config.security.jwt.secret);

                await expect(JwtManager.verifyJWT(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT for an invalid user is passed', async () => {
                const token = jwt.sign({
                    userId: 12345,
                    jwtId: 12345
                }, config.security.jwt.secret);

                await expect(JwtManager.verifyJWT(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT with an invalid JWT ID is passed', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await JwtManager.createJWT(user);
                await user.incrementJwtId();

                await expect(JwtManager.verifyJWT(token)).rejects.toMatchObject({data: {token}});
            });
        });

        describe('invalidateJWT()', () => {
            it('should not validate a JWT after it has been invalidated', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await JwtManager.createJWT(user);
                await expect(JwtManager.verifyJWT(token)).resolves.toBeDefined();
                await JwtManager.invalidateJWT(token);
                await expect(JwtManager.verifyJWT(token)).rejects.toBeDefined();
            });
        });
    });
});
