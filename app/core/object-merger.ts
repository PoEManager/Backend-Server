import errors from './errors';

interface IObject {
    [key: string]: string | number | IObject;
}

async function mergeObjects(a: IObject, b: IObject): Promise<IObject> {
    const ret = a;

    // tslint:disable-next-line: forin
    for (const key in b) {
        if (a[key] && (typeof a[key] !== typeof b[key])) {
            throw new errors.TypeMismatchError(typeof b[key], typeof a[key]);
        }

        // if the type is a string or number, it can simply be assigned.
        // it can also be assigned if the key does not exist yet in the return object (!a[key])
        if (typeof b[key] === 'string' || typeof b[key] === 'number' || !a[key]) {
            ret[key] = b[key];
        } else {
            ret[key] = await mergeObjects(a[key] as IObject, b[key] as IObject);
        }
    }

    return ret;
}

export = mergeObjects;
