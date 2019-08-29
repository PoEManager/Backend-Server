import path from 'path';
import errors from '../../../app/core/errors';
import RootDirectory from '../../../app/core/get-root-directory';
import JSONLoader from '../../../app/core/load-json';

describe('core', () => {
    describe('load-json.ts', () => {
        describe('async variant', () => {
            it('should correctly parse an existing, valid JSON file', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integrationtest', 'res', 'valid-json.json');
                await expect(JSONLoader.loadJSON(p)).resolves.toEqual({
                    test: 'test',
                    number: 1
                });
            });

            it('should throw while parsing an existing, invalid JSON file', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integrationtest', 'res', 'invalid-json.json');
                await expect(JSONLoader.loadJSON(p)).rejects.toEqual(new errors.JSONParseError());
            });

            it('should throw while parsing a JSON file that does not exist', async () => {
                const p = path.join(await RootDirectory.get(), 'test', 'integrationtest', 'res', 'not-existing-json.json');
                await expect(JSONLoader.loadJSON(p)).rejects.toEqual(new errors.FileNotFoundError(p));
            });
        });

        describe('sync variant', () => {
            it('should correctly parse an existing, valid JSON file', () => {
                const p = path.join(RootDirectory.getSync(), 'test', 'integrationtest', 'res', 'valid-json.json');
                expect(JSONLoader.loadJSONSync(p)).toEqual({
                    test: 'test',
                    number: 1
                });
            });

            it('should throw while parsing an existing, invalid JSON file', () => {
                const p = path.join(RootDirectory.getSync(), 'test', 'integrationtest', 'res', 'invalid-json.json');
                expect(() => JSONLoader.loadJSONSync(p)).toThrow(new errors.JSONParseError());
            });

            it('should throw while parsing a JSON file that does not exist', () => {
                const p = path.join(RootDirectory.getSync(),
                    'test', 'integrationtest', 'res', 'not-existing-json.json');
                expect(() => JSONLoader.loadJSONSync(p)).toThrow(new errors.FileNotFoundError(p));
            });
        });
    });
});
