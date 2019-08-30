import fs from 'fs';
import RootDirectory from '../../../app/core/root-directory';

describe('core', () => {
    describe('get-root-directory.ts', () => {
        it('should correctly determine the root of the project (async)', async () => {
            const root = await RootDirectory.get();

            expect(root).toBeDefined();
            await expect(fs.promises.readdir(root)).resolves.toContain('package.json');
        });

        it('should correctly determine the root of the project (sync)', () => {
            const root = RootDirectory.getSync();

            expect(root).toBeDefined();
            expect(fs.readdirSync(root)).toContain('package.json');
        });
    });
});
