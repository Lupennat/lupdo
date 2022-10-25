import { convertObjectParamsToArrayParams, getSqlInfo, isFunctionConstructor } from '../src/utils';

test('is Function Constructor', function () {
    expect(isFunctionConstructor(() => {})).toBeFalsy();
    expect(isFunctionConstructor(function () {})).toBeFalsy();
    expect(isFunctionConstructor(function cane() {})).toBeTruthy();
    expect(isFunctionConstructor(class A {})).toBeTruthy();
});

test('get sql info', function () {
    let [placeholdersLength, namedKeys, sql] = getSqlInfo('select * from table where test =? and testname =:namedKey');
    expect(placeholdersLength).toEqual(1);
    expect(namedKeys).toEqual([
        {
            index: 0,
            identifier: ':',
            name: 'namedKey',
            key: ':namedKey',
            aliases: ['namedKey', ':namedKey']
        }
    ]);
    expect(sql).toEqual('select * from table where test =? and testname =?');

    [placeholdersLength, namedKeys, sql] = getSqlInfo('select * from table where test =$ and testname =:namedKey', '$');
    expect(placeholdersLength).toEqual(1);
    expect(namedKeys).toEqual([
        {
            index: 0,
            identifier: ':',
            name: 'namedKey',
            key: ':namedKey',
            aliases: ['namedKey', ':namedKey']
        }
    ]);
    expect(sql).toEqual('select * from table where test =$ and testname =$');

    [placeholdersLength, namedKeys, sql] = getSqlInfo(
        'select * from table where test =? and testname =:namedKey and testagain = @otherKey',
        '?',
        [':', '@']
    );
    expect(placeholdersLength).toEqual(1);
    expect(namedKeys).toEqual([
        {
            index: 0,
            identifier: ':',
            name: 'namedKey',
            key: ':namedKey',
            aliases: ['namedKey', ':namedKey', '@namedKey']
        },
        {
            index: 1,
            identifier: '@',
            name: 'otherKey',
            key: '@otherKey',
            aliases: ['otherKey', '@otherKey', ':otherKey']
        }
    ]);
    expect(sql).toEqual('select * from table where test =? and testname =? and testagain = ?');

    [placeholdersLength, namedKeys, sql] = getSqlInfo(
        'select * from table where test = ' +
            "':not replace'" +
            ' and testname = ":not replace" and testagain = @otherKey',
        '?',
        [':', '@']
    );
    expect(placeholdersLength).toEqual(0);
    expect(namedKeys).toEqual([
        {
            index: 0,
            identifier: '@',
            name: 'otherKey',
            key: '@otherKey',
            aliases: ['otherKey', '@otherKey', ':otherKey']
        }
    ]);
    expect(sql).toEqual(
        'select * from table where test = ' + "':not replace'" + ' and testname = ":not replace" and testagain = ?'
    );

    [placeholdersLength, namedKeys, sql] = getSqlInfo('select * from table where test LIKE "%:not-replace"', '?', [
        ':',
        '@'
    ]);
    expect(placeholdersLength).toEqual(0);
    expect(namedKeys).toEqual([]);
    expect(sql).toEqual('select * from table where test LIKE "%:not-replace"');

    [placeholdersLength, namedKeys, sql] = getSqlInfo(
        'select * from table where test LIKE ":replace"',
        '?',
        [':', '@'],
        ['%']
    );
    expect(placeholdersLength).toEqual(0);
    expect(namedKeys).toEqual([
        {
            index: 0,
            identifier: ':',
            name: 'replace',
            key: ':replace',
            aliases: ['replace', ':replace', '@replace']
        }
    ]);
    expect(sql).toEqual('select * from table where test LIKE "?"');
});

test('convert object params to array params', function () {
    expect(
        convertObjectParamsToArrayParams([
            {
                index: 0,
                identifier: ':',
                name: 'replace',
                key: ':replace',
                aliases: ['replace', ':replace', '@replace']
            }
        ])
    ).toEqual([]);
    expect(
        convertObjectParamsToArrayParams(
            [
                {
                    index: 0,
                    identifier: ':',
                    name: 'replace',
                    key: ':replace',
                    aliases: ['replace', ':replace', '@replace']
                }
            ],
            { replace: 'replaced' }
        )
    ).toEqual(['replaced']);
    expect(
        convertObjectParamsToArrayParams(
            [
                {
                    index: 0,
                    identifier: ':',
                    name: 'replace',
                    key: ':replace',
                    aliases: ['replace', ':replace', '@replace']
                }
            ],
            { wrong: 'replaced' }
        )
    ).toEqual([]);
    expect(
        convertObjectParamsToArrayParams(
            [
                {
                    index: 1,
                    identifier: ':',
                    name: 'replace',
                    key: ':replace',
                    aliases: ['replace', ':replace', '@replace']
                }
            ],
            { replace: 'replaced' }
        )
    ).toEqual(['replaced']);

    expect(
        convertObjectParamsToArrayParams(
            [
                {
                    index: 1,
                    identifier: ':',
                    name: 'another',
                    key: ':another',
                    aliases: ['another', ':another', '@another']
                },
                {
                    index: 0,
                    identifier: ':',
                    name: 'replace',
                    key: ':replace',
                    aliases: ['replace', ':replace', '@replace']
                }
            ],
            { replace: 'replaced', another: 'anyreplace' }
        )
    ).toEqual(['replaced', 'anyreplace']);

    expect(
        convertObjectParamsToArrayParams(
            [
                {
                    index: 1,
                    identifier: ':',
                    name: 'another',
                    key: ':another',
                    aliases: ['another', ':another', '@another']
                },
                {
                    index: 0,
                    identifier: ':',
                    name: 'replace',
                    key: ':replace',
                    aliases: ['replace', ':replace', '@replace']
                }
            ],
            { another: 'anyreplace' }
        )
    ).toEqual(['anyreplace']);
});
