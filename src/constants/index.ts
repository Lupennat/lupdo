/**
 * Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, FETCH_ASSOC returns only a single value per column name.
 */
export const FETCH_ASSOC = 0b00000000000000001;

/**
 * Specifies that the fetch method shall return each row as an array indexed by column number as returned in the corresponding result set, starting at column 0.
 */
export const FETCH_NUM = 0b00000000000000010;

/**
 * Specifies that the fetch method shall return each row as a key-value object keyed by both column name and number as returned in the corresponding result set, starting at column 0.
 */
export const FETCH_BOTH = 0b00000000000000100;

/**
 * Specifies that the fetch method shall return only a single requested column from the next row in the result set.
 */
export const FETCH_COLUMN = 0b00000000000010000;

/**
 * Specifies that the fetch method shall return a new instance of the requested class, mapping the columns to named properties in the class.
 * Note: The setter method is called if defined in the requested class
 */
export const FETCH_CLASS = 0b00000000000100000;

/**
 * Specifies that the fetch method shall update an existing instance of the requested class, mapping the columns to named properties in the class.
 */
export const FETCH_INTO = 0b00001001;

/**
 * Allows completely customize the way data is treated on the fly.
 */
export const FETCH_FUNC = 0b00000000001000000;

/**
 * Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, FETCH_NAMED returns an array of values per column name.
 */
export const FETCH_NAMED = 0b00000000010000000;

/**
 * Fetch a two-column result into a key-value object where the first column is a key and the second column is the value.
 */
export const FETCH_KEY_PAIR = 0b00000000100000000;

/**
 * Group return by values. Usually combined with FETCH_COLUMN or FETCH_KEY_PAIR.
 */
export const FETCH_GROUP = 0b00000001000000000;

/**
 * Fetch only the unique values.
 */
export const FETCH_UNIQUE = 0b00000010000000000;

/**
 * Determine the class name from the value of first column.
 */
export const FETCH_CLASSTYPE = 0b10000000000000000;

/**
 * Force column names to a specific case. Can take one of the following values
 * - CASE_NATURAL
 * - CASE_UPPER
 * - CASE_LOWER
 *
 * [Default CASE_NATURAL]
 */
export const ATTR_CASE = 'ATTR_CASE';

/**
 * Leave column names as returned by the database driver.
 */
export const CASE_NATURAL = 0b00000000000000001;

/**
 * Force column names to upper case.
 */
export const CASE_UPPER = 0b00000000000000010;

/**
 * Force column names to lower case.
 */
export const CASE_LOWER = 0b00000000000000100;

/**
 * Determines if DEBUG mode is enabled. Can take one of the following values:
 * - DEBUG_DISABLED
 * - DEBUG_ENABLED
 *
 * [Default DEBUG_DISABLED]
 */
export const ATTR_DEBUG = 'ATTR_DEBUG';

/**
 * Disable DEBUG mode
 */
export const DEBUG_DISABLED = 0b00000000000000001;

/**
 * Enable DEBUG mode
 */
export const DEBUG_ENABLED = 0b00000000000000010;

/**
 * Set the default fetch mode
 *
 * [Default FETCH_NUM]
 */
export const ATTR_DEFAULT_FETCH_MODE = 'ATTR_DEFAULT_FETCH_MODE';

/**
 * Determines if and how null and empty strings should be converted. Can take one of the following values:
 * - NULL_NATURAL
 * - NULL_EMPTY_STRING
 * - NULL_TO_STRING
 *
 * [Default NULL_NATURAL]
 */
export const ATTR_NULLS = 'ATTR_NULLS';

/**
 * No conversion takes place.
 */
export const NULL_NATURAL = 0b00000000000000001;

/**
 * Empty strings get converted to null.
 */
export const NULL_EMPTY_STRING = 0b00000000000000010;

/**
 * null gets converted to an empty string.
 */
export const NULL_TO_STRING = 0b00000000000000100;

/**
 * Returns the name of the driver.
 */
export const ATTR_DRIVER_NAME = 'ATTR_DRIVER_NAME';

/**
 * Fetch the next row in the result set.
 */
export const FETCH_ORI_NEXT = 0b00000000000000001;
/**
 * Fetch the previous row in the result set.
 */
export const FETCH_ORI_PRIOR = 0b00000000000000010;
/**
 * Fetch the first row in the result set.
 */
export const FETCH_ORI_FIRST = 0b00000000000000100;
/**
 * Fetch the last row in the result set.
 */
export const FETCH_ORI_LAST = 0b00000000000001000;
