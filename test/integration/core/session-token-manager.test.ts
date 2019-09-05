import jwt from 'jsonwebtoken';
import config from '../../../app/core/config';
import DatabaseConnection from '../../../app/core/database-connection';
import SessionTokenManager from '../../../app/core/session-token-manager';
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

        describe('create()', () => {
            it('should correctly generate a JWT for a user', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await expect(SessionTokenManager.create(user)).resolves.toBeDefined();
            });
        });

        describe('verify()', () => {
            it('should correctly verify a JWT for an existing user', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await SessionTokenManager.create(user);
                const verifiedUser = await SessionTokenManager.verify(token);
                expect(verifiedUser.getId()).toBe(user.getId());
            });

            it('should throw if an invalid JWT is passed', async () => {
                await expect(SessionTokenManager.verify('abcd')).rejects.toMatchObject({data: {token: 'abcd'}});
            });

            it('should throw if a JWT with invalid payload is passed (missing user ID)', async () => {
                const token = jwt.sign({
                    jwtId: 12345
                }, config.security.sessionToken.secret);

                await expect(SessionTokenManager.verify(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT with invalid payload is passed (missing JWT ID)', async () => {
                const token = jwt.sign({
                    userId: 12345
                }, config.security.sessionToken.secret);

                await expect(SessionTokenManager.verify(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT for an invalid user is passed', async () => {
                const token = jwt.sign({
                    userId: 12345,
                    jwtId: 12345
                }, config.security.sessionToken.secret);

                await expect(SessionTokenManager.verify(token)).rejects.toMatchObject({data: {token}});
            });

            it('should throw if a JWT with an invalid JWT ID is passed', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await SessionTokenManager.create(user);
                await user.incrementJwtId();

                await expect(SessionTokenManager.verify(token)).rejects.toMatchObject({data: {token}});
            });
        });

        describe('invalidate()', () => {
            it('should not validate a JWT after it has been invalidated', async () => {
                const user = await UserManager.create({
                    nickname: 'test123',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const token = await SessionTokenManager.create(user);
                await expect(SessionTokenManager.verify(token)).resolves.toBeDefined();
                await SessionTokenManager.invalidate(token);
                await expect(SessionTokenManager.verify(token)).rejects.toBeDefined();
            });
        });
    });
});
