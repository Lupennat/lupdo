// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class NpdoConstants {
    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, Npdo::FETCH_ASSOC returns only a single value per column name.
     */
    static readonly FETCH_ASSOC: number = 0b00000000000000001;

    /**
     * Specifies that the fetch method shall return each row as an array indexed by column number as returned in the corresponding result set, starting at column 0.
     */
    static readonly FETCH_NUM: number = 0b00000000000000010;

    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed by both column name and number as returned in the corresponding result set, starting at column 0.
     */
    static readonly FETCH_BOTH: number = 0b00000000000000100;

    /**
     * Specifies that the fetch method shall return only a single requested column from the next row in the result set.
     */
    static readonly FETCH_COLUMN: number = 0b00000000000010000;

    /**
     * Specifies that the fetch method shall return a new instance of the requested class, mapping the columns to named properties in the class.
     * Note: The setter method is called if defined in the requested class
     */
    static readonly FETCH_CLASS: number = 0b00000000000100000;

    /**
     * Specifies that the fetch method shall update an existing instance of the requested class, mapping the columns to named properties in the class.
     */
    static readonly FETCH_INTO: number = 0b00001001;

    /**
     * Allows completely customize the way data is treated on the fly.
     */
    static readonly FETCH_FUNC: number = 0b00000000001000000;

    /**
     * Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, Npdo::FETCH_NAMED returns an array of values per column name.
     */
    static readonly FETCH_NAMED: number = 0b00000000010000000;

    /**
     * Fetch a two-column result into a key-value object where the first column is a key and the second column is the value.
     */
    static readonly FETCH_KEY_PAIR: number = 0b00000000100000000;

    /**
     * Group return by values. Usually combined with Npdo::FETCH_COLUMN or Npdo::FETCH_KEY_PAIR.
     */
    static readonly FETCH_GROUP: number = 0b00000001000000000;

    /**
     * Fetch only the unique values.
     */
    static readonly FETCH_UNIQUE: number = 0b00000010000000000;

    /**
     * Determine the class name from the value of first column.
     */
    static readonly FETCH_CLASSTYPE: number = 0b10000000000000000;

    /**
     * Force column names to a specific case. Can take one of the following values
     * - Npdo.CASE_NATURAL
     * - Npdo.CASE_UPPER
     * - Npdo.CASE_LOWER
     *
     * [Default Npdo.CASE_NATURAL]
     */
    static readonly ATTR_CASE: string = 'ATTR_CASE';

    /**
     * Leave column names as returned by the database driver.
     */
    static readonly CASE_NATURAL: number = 0b00000000000000001;

    /**
     * Force column names to upper case.
     */
    static readonly CASE_UPPER: number = 0b00000000000000010;

    /**
     * Force column names to lower case.
     */
    static readonly CASE_LOWER: number = 0b00000000000000100;

    /**
     * Set the default fetch mode
     *
     * [Default Npdo.FETCH_NUM]
     */
    static readonly ATTR_DEFAULT_FETCH_MODE: string = 'ATTR_DEFAULT_FETCH_MODE';

    /**
     * Determines if and how null and empty strings should be converted. Can take one of the following values:
     * - Npdo.NULL_NATURAL
     * - Npdo.NULL_EMPTY_STRING
     * - Npdo.NULL_TO_STRING
     *
     * [Default Npdo.NULL_NATURAL]
     */
    static readonly ATTR_NULLS: string = 'ATTR_NULLS';

    /**
     * No conversion takes place.
     */
    static readonly NULL_NATURAL: number = 0b00000000000000001;

    /**
     * Empty strings get converted to null.
     */
    static readonly NULL_EMPTY_STRING: number = 0b00000000000000010;

    /**
     * null gets converted to an empty string.
     */
    static readonly NULL_TO_STRING: number = 0b00000000000000100;

    /**
     * Returns the name of the driver.
     */
    static readonly ATTR_DRIVER_NAME: string = 'ATTR_DRIVER_NAME';

    /**
     * Fetch the next row in the result set.
     */
    static readonly FETCH_ORI_NEXT: number = 0b00000000000000001;
    /**
     * Fetch the previous row in the result set.
     */
    static readonly FETCH_ORI_PRIOR: number = 0b00000000000000010;
    /**
     * Fetch the first row in the result set.
     */
    static readonly FETCH_ORI_FIRST: number = 0b00000000000000100;
    /**
     * Fetch the last row in the result set.
     */
    static readonly FETCH_ORI_LAST: number = 0b00000000000001000;
}

export = NpdoConstants;
