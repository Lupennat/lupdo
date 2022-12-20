export default interface PdoConnectionI {
    query: (sql: string) => Promise<void>;
}
