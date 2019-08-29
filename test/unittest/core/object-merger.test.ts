import errors from '../../../app/core/errors';
import ObjectMerger from '../../../app/core/object-merger';

describe('core', () => {
    describe('object-merger.ts', () => {
        describe('async variant', () => {
            it('should correctly merge two objects', async () => {
                const a = {
                    a: 'a',
                    b: 1,
                    c: {
                        d: 'd',
                        e: 2,
                        f: {
                            g: 'g',
                            h: 3
                        }
                    }
                };

                const b = {
                    a: 'a',
                    b: 3,
                    c: {
                        d: 'xyz',
                        e: 2,
                        f: {
                            i: 'i'
                        }
                    }
                };

                await expect(ObjectMerger.merge(a, b)).resolves.toEqual({
                    a: 'a',
                    b: 3,
                    c: {
                        d: 'xyz',
                        e: 2,
                        f: {
                            g: 'g',
                            h: 3,
                            i: 'i'
                        }
                    }
                });
            });

            it('should throw if types do not match', async () => {
                const a = {
                    a: 'a'
                };

                const b = {
                    a: 1
                };

                await expect(ObjectMerger.merge(a, b)).
                    rejects.toEqual(new errors.TypeMismatchError('number', 'string'));
            });
        });

        describe('sync variant', () => {
            it('should correctly merge two objects', () => {
                const a = {
                    a: 'a',
                    b: 1,
                    c: {
                        d: 'd',
                        e: 2,
                        f: {
                            g: 'g',
                            h: 3
                        }
                    }
                };

                const b = {
                    a: 'a',
                    b: 3,
                    c: {
                        d: 'xyz',
                        e: 2,
                        f: {
                            i: 'i'
                        }
                    }
                };

                expect(ObjectMerger.mergeSync(a, b)).toEqual({
                    a: 'a',
                    b: 3,
                    c: {
                        d: 'xyz',
                        e: 2,
                        f: {
                            g: 'g',
                            h: 3,
                            i: 'i'
                        }
                    }
                });
            });

            it('should throw if types do not match', () => {
                const a = {
                    a: 'a'
                };

                const b = {
                    a: 1
                };

                expect(() => ObjectMerger.mergeSync(a, b)).toThrow(new errors.TypeMismatchError('number', 'string'));
            });
        });
    });
});
