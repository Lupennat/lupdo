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
 * Determines which direction Fetch retrieve data. Can take one of the following values:
 * - FETCH_FORWARD
 * - FETCH_BACKWARD
 *
 * [Default FETCH_FORWARD]
 */
export const ATTR_FETCH_DIRECTION = 'ATTR_FETCH_DIRECTION';

/**
 * Fetch the next row in the result set.
 */
export const FETCH_FORWARD = 0b00000000000000001;
/**
 * Fetch the previous row in the result set.
 */
export const FETCH_BACKWARD = 0b00000000000000010;
