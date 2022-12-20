export default interface PdoAffectingData {
    lastInsertRowid?: string | number | bigint;
    affectedRows?: number;
}
