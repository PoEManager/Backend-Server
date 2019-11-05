import DatabaseConnection from '../../../app/core/database-connection';
import DefaultLogin from '../../../app/model/default-login';
import errors from '../../../app/model/errors';
import Password from '../../../app/model/password';
import UserManager from '../../../app/model/user-manager';

describe('model', () => {
    describe('default-login.ts', () => {
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

        describe('getPassword()', () => {
            it('should return the correct password', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
        describe('getNewPassword()', () => {
            it('should return the correct password', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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
                    DefaultLogin.QueryData.PASSWORD,
                    DefaultLogin.QueryData.NEW_PASSWORD
                ])).resolves.toMatchObject({
                    id: defaultLogin.getId(),
                    password: password.getEncrypted(),
                    newPassword: null
                });
            });

            it('should not set attributes that were not queried (some queried attributes)', async () => {
                const user = await UserManager.createWithDefaultLogin({
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
                const user = await UserManager.createWithDefaultLogin({
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

        describe('updatePassword()', () => {
            it('should correctly update the E-Mail of a verified user', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                await UserManager.validateChange(await user.getChangeUID() as string);

                const defaultLogin = await user.getDefaultLogin();
                const password = await Password.encryptPassword('abc');

                await expect(defaultLogin.getNewPassword()).resolves.toBeNull();
                await expect(defaultLogin.updatePassword(password)).resolves.toBeDefined();
                const newPw = await defaultLogin.getNewPassword();
                expect(newPw).not.toBeNull();
                expect(newPw!.getEncrypted()).toBe(password.getEncrypted());
            });

            it('should throw if another change is already in progress', async () => {
                const user = await UserManager.createWithDefaultLogin({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                const defaultLogin = await user.getDefaultLogin();
                const password = new Password('password');

                await expect(defaultLogin.getNewPassword()).resolves.toBeNull();
                await expect(defaultLogin.updatePassword(password))
                    .rejects.toEqual(new errors.ChangeAlreadyInProgressError(user.getId()));
            });

            it('should throw if the login / user does not exist', async () => {
                const defaultLogin = new DefaultLogin(-1);

                const password = new Password('password');
                await expect(defaultLogin.updatePassword(password))
                    .rejects.toEqual(new errors.UserNotFoundError(-1));
            });
        });
    });
});
