/**
 * Specifies that the default fetch mode shall be used. Default is Npdo.FETCH_OBJ
 */
export const FETCH_DEFAULT: number = 1;

/**
 * Specifies that the fetch method shall return each row as an object with property names that correspond to the column names returned in the result set.
 */
export const FETCH_OBJ: number = 1;
/**
 * Specifies that the fetch method shall return a new instance of the requested class, mapping the columns to named properties in the class.
 */
export const FETCH_CLASS: number = 2;
/**
 * Specifies that the fetch method shall return only a single requested column from the next row in the result set.
 */
export const FETCH_COLUMN: number = 3;
/**
 * Specifies that the fetch method shall return each row as an array indexed by column number as returned in the corresponding result set, starting at column 0.
 */
export const FETCH_ARRAY: number = 4;
/**
 * Specifies that the fetch method shall update an existing instance of the requested class, mapping the columns to named properties in the class.
 */
export const FETCH_INTO: number = 5;

/**
 * Fetch the next row in the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_NEXT: number = 10;
/**
 * Fetch the previous row in the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_PRIOR: number = 11;
/**
 * Fetch the first row in the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_FIRST: number = 12;
/**
 * Fetch the last row in the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_LAST: number = 13;
/**
 * Fetch the requested row by row number from the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_ABS: number = 14;
/**
 * Fetch the requested row by relative position from the current position of the cursor in the result set. Valid only for scrollable cursors.
 */
export const FETCH_ORI_REL: number = 15;
