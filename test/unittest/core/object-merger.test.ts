import errors from '../../../app/core/errors';
import mergeObjects from '../../../app/core/object-merger';

describe('core', () => {
    describe('object-merger.ts', () => {
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

            await expect(mergeObjects(a, b)).resolves.toEqual({
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

            await expect(mergeObjects(a, b)).rejects.toEqual(new errors.TypeMismatchError('number', 'string'));
        });
    });
});
