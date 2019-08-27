import path from 'path';
import errors from '../../../app/core/errors';
import getRootDirectory from '../../../app/core/get-root-directory';
import loadJSON from '../../../app/core/load-json';

describe('core', () => {
    describe('load-json.ts', () => {
        it('should correctly parse an existing, valid JSON file', async () => {
            const p = path.join(await getRootDirectory(), 'test', 'integrationtest', 'res', 'valid-json.json');
            await expect(loadJSON(p)).resolves.toEqual({
                test: 'test',
                number: 1
            });
        });

        it('should throw while parsing an existing, invalid JSON file', async () => {
            const p = path.join(await getRootDirectory(), 'test', 'integrationtest', 'res', 'invalid-json.json');
            await expect(loadJSON(p)).rejects.toEqual(new errors.JSONParseError());
        });

        it('should throw while parsing a JSON file that does not exist', async () => {
            const p = path.join(await getRootDirectory(), 'test', 'integrationtest', 'res', 'not-existing-json.json');
            await expect(loadJSON(p)).rejects.toEqual(new errors.FileNotFoundError(p));
        });
    });
});
