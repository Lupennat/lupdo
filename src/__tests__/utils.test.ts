import { PARAM_BIGINT } from '../constants';
import TypedBinding from '../typed-binding';
import { isFunctionConstructor, paramsToString } from '../utils';

describe('Utils', () => {
    it('Works Is Function Constructor', () => {
        expect(isFunctionConstructor(Array)).toBeTruthy();
        expect(isFunctionConstructor(String)).toBeTruthy();
        expect(isFunctionConstructor(Number)).toBeTruthy();
        expect(isFunctionConstructor(Object)).toBeTruthy();
        expect(isFunctionConstructor(Date)).toBeTruthy();
        expect(isFunctionConstructor(Symbol)).toBeTruthy();
        expect(isFunctionConstructor(BigInt)).toBeTruthy();
        expect(isFunctionConstructor(class Test {})).toBeTruthy();
        expect(isFunctionConstructor(function test() {})).toBeTruthy();
        const testFN = function (): void {};
        expect(isFunctionConstructor(testFN)).toBeTruthy();
        const testArrow = (): void => {};
        expect(isFunctionConstructor(testArrow)).toBeFalsy();
        expect(isFunctionConstructor(function () {})).toBeFalsy();
        expect(isFunctionConstructor(() => {})).toBeFalsy();
    });

    it('Works Params To String', () => {
        let json = paramsToString([
            TypedBinding.create(PARAM_BIGINT, BigInt(10)),
            new Date('2022-12-25'),
            1,
            BigInt(10),
            'text',
            Buffer.from('string'),
            null,
            true,
            [
                TypedBinding.create(PARAM_BIGINT, BigInt(10)),
                new Date('2022-12-25'),
                1,
                BigInt(10),
                'text',
                Buffer.from('string'),
                null,
                true
            ]
        ]);

        expect(json).toBe(
            '[{"type":"BigInt","data":"10"},{"type":"Date","data":"2022-12-25T00:00:00.000Z"},1,{"type":"BigInt","data":"10"},"text",{"type":"Buffer","data":[115,116,114,105,110,103]},null,true,[{"type":"BigInt","data":"10"},{"type":"Date","data":"2022-12-25T00:00:00.000Z"},1,{"type":"BigInt","data":"10"},"text",{"type":"Buffer","data":[115,116,114,105,110,103]},null,true]]'
        );

        json = paramsToString({
            typed: TypedBinding.create(PARAM_BIGINT, BigInt(10)),
            date: new Date('2022-12-25'),
            number: 1,
            bigint: BigInt(10),
            string: 'text',
            buffer: Buffer.from('string'),
            nullable: null,
            boolean: true,
            array: [
                TypedBinding.create(PARAM_BIGINT, BigInt(10)),
                new Date('2022-12-25'),
                1,
                BigInt(10),
                'text',
                Buffer.from('string'),
                null,
                true
            ]
        });

        expect(json).toBe(
            '{"typed":{"type":"BigInt","data":"10"},"date":{"type":"Date","data":"2022-12-25T00:00:00.000Z"},"number":1,"bigint":{"type":"BigInt","data":"10"},"string":"text","buffer":{"type":"Buffer","data":[115,116,114,105,110,103]},"nullable":null,"boolean":true,"array":[{"type":"BigInt","data":"10"},{"type":"Date","data":"2022-12-25T00:00:00.000Z"},1,{"type":"BigInt","data":"10"},"text",{"type":"Buffer","data":[115,116,114,105,110,103]},null,true]}'
        );
    });
});
