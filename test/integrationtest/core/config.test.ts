import config from '../../../app/core/config';
import errors from '../../../app/core/errors';

describe('core', () => {
    describe('config.ts', () => {
        it('should load the configuration from the correct default directory', () => {
            expect(config.test.test).toBe('test');
        });

        it('should load the configuration from a custom directory', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg1');
            expect(cfg.test.test).toBe('test');
        });

        it('should load the "default" environment if there is no fitting environment', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg2');
            expect(cfg.test.test).toBe('test');
        });

        it('should load no configs if there is not even a default environment fitting environment', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg3');
            expect(cfg.test).toBeUndefined();
        });

        it('should correctly use overrides', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg5');
            expect(cfg.test.overriddenTest).toBe('overridden');
        });

        it('should allow partial configs', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg6');
            expect(cfg.test.full).toBe('full');
            expect(cfg.test.partial).toBe('partial');
        });

        it('should throw if the config is in an invalid schema', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg7'))
                .toThrow(new errors.ObjectValidationError(['should have required property \'test\'']));
        });

        it('should throw if the config metadata is in an invalid schema', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg8'))
                .toThrow(new errors.ConfigMetaValidationError(['should NOT have additional properties']));
        });

        it('should throw if a config file can not be parsed', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg9'))
                .toThrow(new errors.JSONParseError());
        });

        it('should throw if a config environment has a nonexistent dependency', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg10'))
                .toThrow(new errors.ConfigExtensionError('nonexistent'));
        });

        it('should correctly load a config with dependencies', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg11');

            expect(cfg.test.test1).toBe('test1');
            expect(cfg.test.test2).toBe('test2');
            expect(cfg.test.test3).toBe('test3');
        });

        it('should work with a complex example', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg12');

            expect(cfg.test.test1).toBe('test1');
            expect(cfg.test.test2).toBe('test2');
            expect(cfg.test.test3).toBe('test3');
            expect(cfg.test2.test).toBe(5);
            expect(cfg.test2.array).toEqual(['a', 'b', 'c']);
        });

        it('should correctly work if only the extension has sources', () => {
            const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg13');
            expect(cfg.test.test).toBe('test');
        });

        it('should correctly work if there are no configurations (empty array)', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg14')).not.toThrow();
        });

        it('should correctly work if there are no configurations (undefined)', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg15')).not.toThrow();
        });

        it('should correctly work if there are no sources', () => {
            expect(() => config._loadDbgConfig('test/integrationtest/res/config/cfg16')).not.toThrow();
        });

        describe('undefined NODE_ENV', () => {
            let oldNodeEnv: string | undefined;
            beforeAll(() => {
                oldNodeEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = undefined;
            });

            afterAll(() => {
                process.env.NODE_ENV = oldNodeEnv;
            });

            it('should load the correct configuration when no NODE_ENV is set', () => {
                const cfg = config._loadDbgConfig('test/integrationtest/res/config/cfg4');
                expect(cfg.test.test).toBe('test');
            });
        });
    });
});
