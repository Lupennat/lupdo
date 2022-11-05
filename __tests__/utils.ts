import { isFunctionConstructor } from '../src/utils';

test('is Function Constructor', function () {
    expect(isFunctionConstructor(() => {})).toBeFalsy();
    expect(isFunctionConstructor(function () {})).toBeFalsy();
    expect(isFunctionConstructor(function cane() {})).toBeTruthy();
    expect(isFunctionConstructor(class A {})).toBeTruthy();
});
