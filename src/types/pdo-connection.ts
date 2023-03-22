export default interface PdoConnectionI {
    version: string;
    query: (sql: string) => Promise<void>;
}
