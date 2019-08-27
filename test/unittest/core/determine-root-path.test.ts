import fs from 'fs';
import getRootDirectory from '../../../app/core/get-root-directory';

describe('core', () => {
    describe('get-root-directory.ts', () => {
        it('should correctly determine the root of the project', async () => {
            const root = await getRootDirectory();

            expect(root).toBeDefined();
            await expect(fs.promises.readdir(root)).resolves.toContain('package.json');
        });
    });
});
