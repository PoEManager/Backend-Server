import DatabaseConnection from '../../../app/core/database-connection';
import SessionTokenManager from '../../../app/core/session-token-manager';
import UserManager from '../../../app/model/user-manager';

describe('core', () => {
    describe('session-token-manager.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });

            await DatabaseConnection.reset();
        });

        describe('create()', () => {
            it('should correctly generate a session ID for a user', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
            it('should correctly verify a session ID for an existing user', async () => {
                const user = await UserManager.createWithDefaultLogin({
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

            it('should throw if an invalid session ID is passed', async () => {
                await expect(SessionTokenManager.verify('abcd')).rejects.toBeDefined();
            });
        });

        describe('invalidate()', () => {
            it('should not validate a session ID after it has been invalidated', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
