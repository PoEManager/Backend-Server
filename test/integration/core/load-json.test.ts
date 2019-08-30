import path from 'path';
import errors from '../../../app/core/errors';
import JSONLoader from '../../../app/core/load-json';
import RootDirectory from '../../../app/core/root-directory';

describe('core', () => {
    describe('load-json.ts', () => {
        describe('async variant', () => {
            it('should correctly parse an existing, valid JSON file', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integration', 'res', 'valid-json.json');
                await expect(JSONLoader.loadJSON(p)).resolves.toEqual({
                    test: 'test',
                    number: 1
                });
            });

            it('should throw while parsing an existing, invalid JSON file', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integration', 'res', 'invalid-json.json');
                await expect(JSONLoader.loadJSON(p)).rejects.toEqual(new errors.JSONParseError());
            });

            it('should throw while parsing a JSON file that does not exist', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integration', 'res', 'not-existing-json.json');
                await expect(JSONLoader.loadJSON(p)).rejects.toEqual(new errors.FileNotFoundError(p));
            });
        });

        describe('sync variant', () => {
            it('should correctly parse an existing, valid JSON file', () => {
                const p = path.join(RootDirectory.getSync(), 'test', 'integration', 'res', 'valid-json.json');
                expect(JSONLoader.loadJSONSync(p)).toEqual({
                    test: 'test',
                    number: 1
                });
            });

            it('should throw while parsing an existing, invalid JSON file', () => {
                const p = path.join(RootDirectory.getSync(), 'test', 'integration', 'res', 'invalid-json.json');
                expect(() => JSONLoader.loadJSONSync(p)).toThrow(new errors.JSONParseError());
            });

            it('should throw while parsing a JSON file that does not exist', () => {
                const p = path.join(RootDirectory.getSync(),
                    'test', 'integration', 'res', 'not-existing-json.json');
                expect(() => JSONLoader.loadJSONSync(p)).toThrow(new errors.FileNotFoundError(p));
            });
        });
    });
});
