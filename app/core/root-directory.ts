import fs from 'fs';
import path from 'path';

namespace RootDirectory {
    /**
     * The name of the package.json file.
     */
    const PACKAGE_JSON_NAME = 'package.json';

    /**
     * The cached directory.
     */
    let rootDir: string | null = null;

    /**
     * @returns The root directory of the project, i.e. the directory that contains the package.json file.
     */
    export function getSync(): string {
        if (rootDir) {
            return rootDir;
        }

        return findPackageJsonImplSync(__dirname);
    }

    /**
     * Recursively scans directories for the package.json file.
     *
     * If the file is not located in the current directory, the parent directory will be checked.
     *
     * @param currentPath The path that is currently being searched.
     */
    function findPackageJsonImplSync(currentPath: string): string {
        const paths = fs.readdirSync(currentPath);

        for (const p of paths) {
            if (p === PACKAGE_JSON_NAME) {
                rootDir = currentPath;
                return currentPath;
            }
        }

        return findPackageJsonImplSync(path.resolve(currentPath, '..'));
    }

    /**
     * @returns The root directory of the project, i.e. the directory that contains the package.json file.
     */
    export async function get(): Promise<string> {
        if (rootDir) {
            return rootDir;
        }

        return findPackageJsonImpl(__dirname);
    }

    /**
     * Recursively scans directories for the package.json file.
     *
     * If the file is not located in the current directory, the parent directory will be checked.
     *
     * @param currentPath The path that is currently being searched.
     */
    export async function findPackageJsonImpl(currentPath: string): Promise<string> {
        const paths = await fs.promises.readdir(currentPath);

        for (const p of paths) {
            if (p === PACKAGE_JSON_NAME) {
                rootDir = currentPath;
                return currentPath;
            }
        }

        return findPackageJsonImpl(path.resolve(currentPath, '..'));
    }
}

export = RootDirectory;
