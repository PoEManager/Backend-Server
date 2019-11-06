import DatabaseConnection from '../../../app/core/database-connection';
import errors from '../../../app/model/errors';
import GoogleLogin from '../../../app/model/google-login';
import UserManager from '../../../app/model/user-manager';

describe('model', () => {
    describe('google-login.ts', () => {
        beforeEach(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
                await conn.query('DELETE FROM `GoogleLogins`');
            });
        });

        afterAll(async () => {
            await DatabaseConnection.transaction(async conn => {
                await conn.query('DELETE FROM `Users`');
            });

            await DatabaseConnection.reset();
        });

        describe('getId()', () => {
            expect(new GoogleLogin(1).getId()).toBe(1);
        });

        describe('getGoogleUID()', () => {
            it('should return the correct Google user ID', async () => {
                const user = await UserManager.createWithGoogleLogin('google-uid', 'nickname', 'test@test.com');

                const googleLogin = await user.getGoogleLogin();

                await expect(googleLogin.getGoogleUID()).resolves.toBe('google-uid');
            });

            it('should throw DefaultLoginNotFoundError error if the login does note exist', async () => {
                await expect(new GoogleLogin(-1).getGoogleUID())
                    .rejects.toEqual(new errors.GoogleLoginNotFoundError(-1));
            });
        });
    });
});
