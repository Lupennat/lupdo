import { isFunctionConstructor } from '../utils';

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
});
