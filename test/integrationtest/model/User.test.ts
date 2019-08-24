import DatabaseConnection from '../../../app/core/DatabaseConnection';
import errors from '../../../app/model/Errors';
import UserManager from '../../../app/model/UserManager';

describe('model', () => {
    describe('User.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `DefaultLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.reset();
        });

        describe('delete()', () => {
            it('should correctly delete an existing user', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                expect(user).toBeDefined();

                await expect(user.delete()).resolves.toBeUndefined();

                await expect(UserManager.get(user.getId())).rejects.toEqual(new errors.UserNotFoundError(user.getId()));
            });

            it('should return false when deleting a user that does not exist', async () => {
                const user = await UserManager.create({
                    nickname: 'nickname',
                    loginData: {
                        email: 'test@test.com',
                        unencryptedPassword: 'password'
                    }
                });

                expect(user).toBeDefined();

                await expect(user.delete()).resolves.toBeUndefined();
                await expect(user.delete()).rejects.toEqual(new errors.UserNotFoundError(user.getId()));
            });
        });
    });
});
