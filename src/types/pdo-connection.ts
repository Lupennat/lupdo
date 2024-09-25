export interface PdoConnectionI {
  version: string;
  query: (sql: string) => Promise<void>;
}
