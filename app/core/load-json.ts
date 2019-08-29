import fs from 'fs';
import errors from './errors';

namespace JSONLoader {
    /**
     * @param jsonPath The path to the JSON file.
     * @returns The parse JSON object.
     *
     * @throws **JSONParseError** If either the file could not be opened or the contents is invalid JSON.
     */
    export async function loadJSON(jsonPath: string): Promise<any> {
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

    /**
     * @param jsonPath The path to the JSON file.
     * @returns The parse JSON object.
     *
     * @throws **JSONParseError** If the file contents is invalid JSON.
     * @throws **FileNotFoundError** If the file could not be found.
     */
    export function loadJSONSync(jsonPath: string): any {
        let raw: string;

        try {
            raw = fs.readFileSync(jsonPath, 'utf-8');
        } catch (error) {
            throw new errors.FileNotFoundError(jsonPath);
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            throw new errors.JSONParseError();
        }
    }

}

export = JSONLoader;
