import fs from 'fs';
import errors from './errors';

/**
 * @param jsonPath The path to the JSON file.
 * @returns The parse JSON object.
 *
 * @throws **JSONParseError** If either the file could not be opened or the contents is invalid JSON.
 */
async function loadJSON(jsonPath: string): Promise<any> {
    let raw: string;

    try {
        raw = await fs.promises.readFile(jsonPath, 'utf-8');
    } catch (error) {
        throw new errors.FileNotFoundError(jsonPath);
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new errors.JSONParseError();
    }
}
export = loadJSON;
