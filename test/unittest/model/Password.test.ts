import Password from '../../../app/model/Password';

describe('model', () => {
    describe('Password.ts', () => {
        it('should correctly encrypt a new password', async () => {
            await expect(Password.encryptPassword('password')).resolves.toBeDefined();
        });

        it('should correctly compare passwords', async () => {
            const password = await Password.encryptPassword('password');

            await expect(password.compareTo('password')).resolves.toBeTruthy();
        });

        it('should correctly get encrypted passwords', async () => {
            const password = await Password.encryptPassword('password');

            expect(password.getEncrypted()).toBeDefined();
        });
    });
});
