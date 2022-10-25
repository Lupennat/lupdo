import { Pdo } from '../@types/index';

export function isFunctionConstructor(fn: Function): boolean {
    try {
        const Proxied = new Proxy(fn as FunctionConstructor, {
            construct() {
                return {};
            }
        });
        // eslint-disable-next-line no-new
        new Proxied();
        return fn.name !== '';
    } catch (err) {
        return false;
    }
}

export function getSqlInfo(
    rawSql: string,
    placeholder: Pdo.PreparedStatement.Placeholder = '?',
    identifiers: Pdo.PreparedStatement.Identifiers = [':'],
    negativeLooks: Pdo.PreparedStatement.NegativeLooks = ['"', "'", '`', '%']
): [number, Pdo.PreparedStatement.ObjectParamsDescriptor[], string] {
    const placeholderRegex = new RegExp(`[${placeholder}]`, 'g');
    const placeholders = (rawSql.match(placeholderRegex) ?? []).length;
    const keys = [];
    const keysRegex = new RegExp(
        `(?:^|[^a-zA-Z0-9${negativeLooks.join('')}])[${identifiers.join('')}](\\w+)(?!\\w)`,
        'g'
    );
    let index = 0;

    for (const match of rawSql.matchAll(keysRegex)) {
        const name = match[1];
        const identifier = match[0].replace(name, '').slice(-1);
        const key = identifier + name;
        const aliases = [name, key];

        for (const id of identifiers) {
            if (id === identifier) {
                continue;
            }
            aliases.push(id + name);
        }

        keys.push({
            index,
            identifier,
            name,
            key,
            aliases
        });

        index++;

        rawSql = rawSql.replace(key, placeholder);
    }

    return [placeholders, keys, rawSql];
}

export function convertObjectParamsToArrayParams(
    objectParamDescriptors: Pdo.PreparedStatement.ObjectParamsDescriptor[],
    objectParams: Pdo.PreparedStatement.ObjectParams = {}
): Pdo.PreparedStatement.ArrayParams {
    const params = [];
    for (const objectParamsDescriptor of objectParamDescriptors) {
        if (objectParamsDescriptor.name in objectParams) {
            params[objectParamsDescriptor.index] = objectParams[objectParamsDescriptor.name];
        }
    }

    return params.filter(function (element) {
        return element !== undefined;
    });
}
