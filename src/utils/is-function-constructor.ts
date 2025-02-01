export function isFunctionConstructor(fn: any): boolean {
  try {
    const Proxied = new Proxy(fn as FunctionConstructor, {
      construct() {
        return {};
      },
    });

    new Proxied();
    return fn.name !== '';
  } catch (err) {
    return false;
  }
}
