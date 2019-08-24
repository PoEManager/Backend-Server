import DatabaseConnection from '../../../app/core/DatabaseConnection';
import DefaultLogin from '../../../app/model/DefaultLogin';
import errors from '../../../app/model/Errors';
import Password from '../../../app/model/Password';
import UserManager from '../../../app/model/UserManager';

describe('model', () => {
    describe('DefaultLogin.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
        });

        describe('getEmail()', () => {
            it('should return the correct email', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();

                await expect(defaultLogin.getEmail()).resolves.toBe('test@test.com');
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new DefaultLogin(-1).getEmail()).rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });

        describe('getPassword()', () => {
            it('should return the correct password', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();
                const password = (await Password.encryptPassword('password')).getEncrypted();
                const encryptPassword = (await defaultLogin.getPassword()).getEncrypted();

                await expect(encryptPassword).toBe(password);
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new DefaultLogin(-1).getPassword())
                    .rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });

        // todo update as soon as emails can be updated
        describe('getNewEmail()', () => {
            it('should return the correct email', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();

                await expect(defaultLogin.getNewEmail()).resolves.toBeNull();
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new DefaultLogin(-1).getNewEmail())
                    .rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });

        // todo update as soon as emails can be updated
        describe('getNewPassword()', () => {
            it('should return the correct password', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();

                await expect(defaultLogin.getNewPassword()).resolves.toBeNull();
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new DefaultLogin(-1).getNewPassword())
                    .rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });

        describe('query()', () => {
            it('should correctly query the login\'s attributes', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();
                const password = await Password.encryptPassword('password');

                await expect(defaultLogin.query([
                    DefaultLogin.QueryData.ID,
                    DefaultLogin.QueryData.EMAIL,
                    DefaultLogin.QueryData.PASSWORD,
                    DefaultLogin.QueryData.NEW_EMAIL,
                    DefaultLogin.QueryData.NEW_PASSWORD
                ])).resolves.toMatchObject({
                    id: defaultLogin.getId(),
                    email: 'test@test.com',
                    password: password.getEncrypted(),
                    newEmail: null,
                    newPassword: null
                });
            });

            it('should not set attributes that were not queried (some queried attributes)', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();

                await expect(defaultLogin.query([])).resolves.toMatchObject({});
            });

            it('should not set attributes that were not queried (no queried attributes)', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();

                await expect(defaultLogin.query([DefaultLogin.QueryData.ID]))
                    .resolves.toMatchObject({id: defaultLogin.getId()});
            });

            it('should throw UserNotFound error if the user does note exist', async () => {
                await expect(new DefaultLogin(-1).query([])).rejects.toEqual(new errors.DefaultLoginNotFoundError(-1));
            });
        });
    });
});
