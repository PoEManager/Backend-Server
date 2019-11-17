import Ajv from 'ajv';
import _ from 'lodash';
import path from 'path';
import errors from './errors';
import JSONLoader from './load-json';
import RootDirectory from './root-directory';

/**
 * Nomenclature:
 * **configuration environment**:
 * An environment such as 'production' or 'test'. Passed through the environment variable `NODE_ENV`. There can only
 * one environment be active at the same time, but one environment can extend another environment. Extensions are
 * transitive, if environment A extends environment B which extends environment C, then environment A also extends
 * environment C.
 *
 * **source(s)**:
 * Each configuration environment usually has one or more sources. Those sources are directories, in which
 * single files configurations are stored.
 *
 * If a configuration environment has multiple sources, the configuration files from those sources will be merged
 * into a single configuration. The merging will work in a way, that if two configuration files A and B are merged,
 * the properties that do not exist in A but in B will simply be added to the final configuration. If a property exists
 * in both A and B, the property from B will be merged with the one in A. This merging will override non-compound
 * values (like strings and numbers) and merge together compound values (like objects and strings).
 * The merging takes places in the order in which the sources appear in the config definition.
 * For example:
 * Object A:
 * ```JSON
 * {
 *     "key": "value",
 *     "compound": {
 *         "key1": "value1"
 *     }
 * }
 * ```
 *
 * Object B:
 * ```JSON
 * {
 *     "key": "another-value",
 *     "compound": {
 *         "key2": "value2"
 *     }
 * }
 * ```
 *
 * The resulting object:
 * ```JSON
 * {
 *     "key": "another-value",
 *     "compound": {
 *         "key1": "value1",
 *         "key2": "value2"
 *     }
 * }
 * ```
 *
 * When one configuration environment extends another and both define sources, then only the sources of the one that
 * extends the other will be used (i.e. the sources will not be merged).
 *
 * Common sources are: 'default' and 'local'. The first one provides default values that usually remain unchanged
 * (changes to these values will be provided by overriding them in another sources). The latter one is a configuration
 * that is tied to a specific host or setup.
 *
 * There is a special source, called '$config-env'. It is a placeholder for the name of the configuration environment.
 * This placeholder can be used as a source or as part of a source. For example: "$config-env", "$config-env-local".
 *
 * **configuration**:
 * A configuration environment defines one or more configurations. These configurations have a name and a schema. The
 * name defines a) the object trough which the configuration can be accessed and b) the name of the configuration files.
 * The files names will be the name of the configuration with the extension `.json` (e.g. a configuration with the name
 * 'test' will have the file name `test.json`).
 *
 * A configuration must match its schema, otherwise error(s) will be generated. This schema must only be matched after
 * after the final configuration has been generated from all sources. I.e., single configuration files must only contain
 * parts of the entire configuration. This can be used for example for usernames or passwords, for which no proper
 * default values can be set.
 *
 * When one configuration environment extends another one, then the configurations from both environments will be used.
 */

 /**
  * A single configuration definition.
  */
interface IConfiguration {
    /**
     * The name of the configuration.
     */
    name: string;

    /**
     * The JSON schema.
     */
    schema: any;
}

/**
 * A single configuration environment.
 */
interface IConfigEnvironment {
    /**
     * The sources.
     */
    sources?: string[];

    /**
     * The configurations in the environment.
     */
    configs?: IConfiguration[];

    /**
     * The name of the environment that this environment extends.
     */
    extends?: string;
}

/**
 * The entire configuration definition.
 */
interface IConfigDefinition {
    [key: string]: IConfigEnvironment;
}

/**
 * The default configuration root.
 */
const DEFAULT_CONFIG_ROOT = path.join(RootDirectory.getSync(), 'config');

/**
 * The location of the configuration meta JSON schema.
 */
const CONFIG_DEF_SCHEMA = path.join(RootDirectory.getSync(), 'res', 'schema', 'config-definition.schema.json');

/**
 * $config-env
 */
const PLACEHOLDER_CONFIG_ENV = '$config-env';

/**
 * The default environment.
 */
const DEFAULT_ENV = 'production';

/**
 * The name of the config definition file.
 */
const CONFIG_DEFINITION_FILE_NAME = 'config-definition.json';

/**
 * The default config environment.
 */
const DEFAULT_CONFIG_ENV = 'default';

/**
 * A complete configuration.
 *
 * Contains the configuration values and a function to load a new configuration.
 */
interface IConfigExportObject {
    _loadDbgConfig: (configRoot: string) => IConfigExportObject;
    [key: string]: any;
}

function getEnv(): string {
    return process.env.NODE_ENV === 'undefined' || !process.env.NODE_ENV ? DEFAULT_ENV : process.env.NODE_ENV;
}

/**
 * Loads a configuration.
 *
 * @param configRoot The root of the config. The `config-definition.json` is file located here.
 * @returns The loaded configuration.
 */
function loadConfig(configRoot: string): IConfigExportObject {
    let ret: IConfigExportObject = {_loadDbgConfig: loadConfig};
    const configDef = loadConfigDefinition(configRoot);
    const env = getEnv();

    const config = configDef[env] || configDef[DEFAULT_CONFIG_ENV];

    if (config) {
        const finalConfig = makeFinalConfigEnvironment(env, config, configDef);
        ret = loadConfigEnvironment(configRoot, finalConfig);
    }

    return ret;
}

/**
 * Loads the config metadata. I.e. all of the various configurations and their files.
 *
 * @param configRoot The root of the configuration.
 * @returns The configuration metadata.
 *
 * @throws **ObjectValidationError** If the configuration definition is invalid.
 */
function loadConfigDefinition(configRoot: string): IConfigDefinition {
    const configMeta = path.join(configRoot, CONFIG_DEFINITION_FILE_NAME);
    const configMetaJSON = JSONLoader.loadJSONSync(configMeta);
    const configMetaSchema = JSONLoader.loadJSONSync(CONFIG_DEF_SCHEMA);

    const ajv = new Ajv();
    const validate = ajv.compile(configMetaSchema);
    const valid = validate(configMetaJSON);

    if (!valid) {
        throw new errors.InternalConfigMetaValidationError(validate.errors!, validate.schema as object);
    }

    return configMetaJSON as IConfigDefinition;
}

/**
 * Merges two configuration environments. Used for environment extensions.
 * Does not work recursively.
 * Only properly merges the 'configs' properly. The 'extends' property is ignored. Sources are merged in the following
 * way: `final.sources = env.sources ? env.sources : extends.sources`.
 *
 * @param env The base environment.
 * @param extension The extension of the base environment.
 */
function mergeConfigsEnvironments(env: IConfigEnvironment, extension: IConfigEnvironment): IConfigEnvironment {
    let configs: IConfiguration[] | undefined;

    if (env.configs && extension.configs) {
        configs = _.concat(env.configs, extension.configs);
    } else if (env.configs && !extension.configs) {
        configs = env.configs;
    } else if (!env.configs && extension.configs) {
        configs = extension.configs;
    } else {
        configs = undefined;
    }

    const ret: IConfigEnvironment = {
        sources: (env.sources && env.sources.length > 0) ? env.sources : extension.sources,
        configs
    };

    return ret;
}

/**
 * Creates the final configuration environment from one configuration environment by recursively merging the
 * environments that it extends into it.
 *
 * Does not set the 'sources' property of the; this has to be done afterwards.
 *
 * @param name The name of the environment.
 * @param config The environment itself.
 * @param configDef The configuration definition.
 */
function makeFinalConfigEnvironment(name: string, config: IConfigEnvironment,
    configDef: IConfigDefinition): IConfigEnvironment {

        let ret = config;

        if (ret.extends) {
            if (!configDef[ret.extends]) {
                throw new errors.ConfigExtensionError(ret.extends);
            }

            // recursively load the parent config(s)
            const parentEnv = makeFinalConfigEnvironment(ret.extends, configDef[ret.extends], configDef);
            ret = mergeConfigsEnvironments(ret, parentEnv);
        }

        ret.sources = processSources(ret);

        return ret;
}

/**
 * Processes special keys like $config-env and removes duplicates.
 * The schema forbids duplicates, but they may appear through the aforementioned replacements.
 *
 * @param config The current config.
 * @returns The processed sources list.
 */
function processSources(config: IConfigEnvironment): string[] {
    if (!config.sources) {
        return [];
    }

    const ret: string[] = [];

    // process special keys
    // tslint:disable-next-line: forin
    for (const key in config.sources) {
        ret[key] = config.sources[key].replace(PLACEHOLDER_CONFIG_ENV, getEnv());
    }

    return _.uniq(ret); // remove uniques (first one is kept)
}

/**
 * Loads a single configuration environment.
 *
 * @param root The configuration root.
 * @param config The configuration environment to load.
 */
function loadConfigEnvironment(root: string, config: IConfigEnvironment): IConfigExportObject {
    const ret: IConfigExportObject = {_loadDbgConfig: loadConfig};

    if (!config.configs) {
        return ret;
    }

    for (const file of config.configs) {
        if (config.sources && config.sources.length > 0) { // ignore configurations that do not have any sources
            ret[file.name] = loadConfiguration(root, config.sources, file);
        }
    }

    return ret;
}

/**
 * Creates the file system path to a single configuration file.
 *
 * @param root The root directory of the configuration.
 * @param source The source.
 * @param name The name of the configuration
 */
function makeConfigFilePath(root: string, source: string, name: string): string {
    return path.join(root, source, `${name}.json`);
}

/**
 * Loads a single configuration.
 *
 * @param root The root of the configuration.
 * @param sources The sources of the configuration.
 * @param file The file to load.
 *
 * @throws **ObjectValidationError** If the configuration does not match its schema.
 */
function loadConfiguration(root: string, sources: string[], file: IConfiguration): any {
    const files = _.map(sources, source => makeConfigFilePath(root, source, file.name));

    let ret: any = {};

    for (const f of files) {
        try {
            // ret = ObjectMerger.mergeSync(ret, loadConfigFile(f));
            ret = _.mergeWith(ret, loadConfigFile(f), (obj, src) => {
                if (_.isArray(obj) && _.isArray(src)) {
                    return obj.concat(src);
                }
                return undefined;
            });
        } catch (error) {
            if (!(error instanceof errors.FileNotFoundError)) {
                throw error;
            }

            // file could not be opened / found => ignore
        }
    }

    // validate final object
    const ajv = new Ajv();
    const validate = ajv.compile(file.schema);
    const valid = validate(ret);

    if (!valid) {
        const objValError = new errors.InternalObjectValidationError(validate.errors!, validate.schema as object, ret);
        throw new errors.ConfigValidationError(file.name, objValError);
    }

    return ret;
}

/**
 * Loads a single configuration file.
 *
 * @param filePath The path to the configuration.
 */
function loadConfigFile(filePath: string): any {
    return JSONLoader.loadJSONSync(filePath);
}

export = loadConfig(DEFAULT_CONFIG_ROOT);
