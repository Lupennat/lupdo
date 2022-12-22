# Fetch Modes

-   Classic Modes:
    -   [Fetch Both](#fetch-both)
    -   [Fetch Array](#fetch-array)
    -   [Fetch Json](#fetch-json)
-   Most useful modes:
    -   [Fetch Column](#fetch-column)
    -   [Fetch Pair](#fetch-pair)
-   OOP:
    -   [Fetch Object](#fetch-object)
-   Miscellaneous
    -   [Fetch Closure](#fetch-closure)
    -   [Fetch Named](#fetch-named)
-   [Fetched](#fetched)

    -   [get](#fetch-get)
    -   [unique](#fetch-unique)
    -   [group](#fetch-group)
    -   [all](#fetch-all)

-   [Cursor](#cursor)
    -   [FETCH_FORWARD](#fetch-forward)
    -   [FETCH_BACKWARD](#fetch-backward)

## Fetch Both

The row is returned in the form of object, where data is duplicated, to be accessed via both numeric and key indexes.

```ts
const fetched = (await pdo.query("SELECT * from users LIMIT 1").fetchBoth().get()
/*
{
    '0' : 11
    'id' : 11,
    '1': 'Claudio'
    'name' : 'Claudio'
    '2' : 'male',
    'gender' : 'male',
}
*/
```

## Fetch Array

The row is returned in the form of array.

```ts
const user = (await pdo.query("SELECT * from users LIMIT 1").fetchArray().get();
/*
[
    11,
    'Claudio',
    'male'
]
*/
```

## Fetch Json

The row is returned in the form of object. See also [Fetch Named](#fetch-named)

```ts
const user = (await pdo.query("SELECT * from users LIMIT 1").fetchJson().get();
/*
{
    'id' : 11,
    'name' : 'Claudio'
    'gender' : 'male',
}
*/
```

## Fetch Column

It is often very handy to get plain one-dimensional array right out of the query, if only one column out of many rows being fetched. Here you go:

```ts
const data = (await pdo.query("SELECT name FROM users").fetchColumn<string>(0).all();
/*
[
    'Claudio',
    'Enrico',
    'Nicola',
    'Max'
]
*/
```

## Fetch Pair

> **Note**
> Fetch pair return a Map not A Fetch Object

Also extremely useful format, when we need to get the same column as for [Fetch Column](#fetch-column), but indexed not by numbers in order but by an unique field:

```ts
const data = (await pdo.query("SELECT name, gender FROM users").fetchPair<string,string>();
/*
Map(4) {
    'Claudio' => 'male',
    'Enrico' => 'male',
    'Nicola' => 'male',
    'Max' => 'male'
}
*/
```

The returned key-value format is excellent for the dictionary like data or simply for indexed values, like below

```ts
const data = (await pdo.query("SELECT gender, count(*) FROM users GROUP BY gender").fetchPair<string,number>();
/*
Map(5) {
    'male' => 4,
    'female' => 2,
    'non-binary' => 3,
    'transgender' => 2,
    'prefer-not-to-respond' => 1
}
```

## Fetch Object

The cornerstone of object manipulation in Creates an instance of a class with a given name, mapping returned columns to the class' properties. This mode can be used to get either a single row or an array of rows from database. With fetchObject() the approach is quite familiar:

```ts
class User {}
const users = pdo.query('SELECT name FROM users').fetchObject(User).all();
```

will give you an array consists of objects of a User class, with properties filled from returned data:

```ts
[
    User {
        name: 'Claudio'
    },
    User {
        name: 'Enrico
    }
]
```

No matter which method you choose, all the returned columns will be assigned to the corresponding class' properties according to the following rules:

-   if there is a class property, which name is the same as a column name, the column value will be assigned to this property.
-   if there is no such property, but exist a setter then the setter will be called.
-   if setter method is not defined for the class, then a public property will be created and a column value assigned to it.

Properties are always assigned after class constructor is called.

For example, this code

```ts
class User {
    name;
}
const user = pdo.query('SELECT * FROM users LIMIT 1').fetchObject(User).get();
```

will give you an object with all the properties automatically assigned, no matter were they exist in the class or not:

```ts
User {
    id: 11
    name: 'Claudio'
    gender: 'male'
},
```

From this you can tell that to avoid an automated property creation you need to use the setter method to filter the properties out.

```ts
class User {
    #name;
    public set name(value) {
        this.#name = value;
    }
}
const user = pdo.query('SELECT * FROM users LIMIT 1').fetchObject(User).get();
/*
User {
    // #name: 'Claudio'
    id: 11,
    gender: 'mal'
}
*/
```

As you can see, in this mode Pdo can assign values to private properties as well. Which is a bit unexpected but extremely useful.

Of course, for the newly created classes we may want to supply constructor parameters. So, let's add them to the examples above:

```ts
class User {
    constructor(car) {
        this.car = car;
    }
}
const users = pdo.query('SELECT name FROM users LIMIT 1').fetchObject(User, ['Tesla']).get();
```

will give you

```ts
User {
    name: 'Claudio'
    car: 'Tesla'
}
```

## Fetch Closure

For the closure lovers. Not very convenient as you should list parameters for the every returned column manually. For example, a [Fetch Column](#fetch-column) emulator:

```ts
pdo.query('SELECT name FROM users')
    .fetchClosure(function (first: string) {
        return first;
    })
    .all();
/*
[
    'Claudio',
    'Enrico',
    'Nicola',
    'Max'
]
*/
```

## Fetch Named

Almost exactly the same as [Fetch Json](#fetch-json), but with one little difference. Many times I've seen a question, whether it's possible to distinguish different fields with the same names that returned by same query. With the only answer is using aliases in SQL or numeric indices instead of associative. However, Pdo offers another way. If this mode is used, returned values are assigned the same way as with `fetchJson`, but if there are several columns with the same name in the result set, all values are stored in the nested array. For example, let's try to select from users and companies, while both tables has a column name. Using `fetchJson`, we'll lose one of the names:

```ts
const data = pdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetchJson().get();
/*
{
  'name' => 'Lupennat srl'
  'gender' => 'male
}
*/
```

While if `fetchNamed` is used instead, everything will be kept intact:

```ts
const data = pdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetchNamed().get();
/*
{
    'name': ['Claudio', 'Lupennat srl'],
    'gender' : 'male'
}
*/
```

## Fetched

Fetched Object is in iterable object, that expose theese methods:

-   get: () => T | undefined;
-   all: () => T[];
-   group: () => Group<T>;
-   unique: () => Unique<T>;

```ts
(await pdo.query('SELECT * from users').fetchArray()).get();
/*
[1, 'Claudio', 'male']
*/
(await pdo.query('SELECT * from users').fetchArray()).all();
/*
[
    [1, 'Claudio', 'male'],
    [2, 'Enrico' , 'male'],
    [3, 'Nicola' , 'male'],
    ...
]
*/
(await pdo.query('SELECT * from users').fetchArray()).unique();
/*
Map (4) {
    1 => ['Claudio', 'male'],
    2 => ['Enrico', 'male'],
    3 => ['Nicola', 'male'],
    ...
}
*/
(await pdo.query('SELECT gender, users.* FROM users').fetchArray()).unique();
/*
Map (4) {
    'male': [
        [1, 'Claudio', 'male'],
        [2, 'Enrico', 'male'],
        [3, 'Nicola', 'male'],
    ],
    ....
}
*/
```

> **Note**
> Methods Get And All, will return data according to [cursor orientation](#cursor-orientation)

### Fetch Get

It return the next row from the statement

```ts
const fetch = await pdo.query('SELECT * from users').fetchArray();
fetch.get();
/*
[1, 'Claudio', 'male']
*/
fetch.get();
/*
[2, 'Enrico', 'male']
*/
```

### Fetch All

It return all the raws from the statment

```ts
const fetch = await pdo.query('SELECT * from users').fetchArray();
fetch.all();
/*
[
    [1, 'Claudio', 'male'],
    [2, 'Enrico', 'male']
    [3, 'Nicola', 'male']
*/
```

### Fetch Unique

> **Note**
> Fetch unique return a Map

Same as [Fetch Pair](#fetch-pair), but getting not one column but full row, yet indexed by an unique field

```ts
const data = (await pdo.query('SELECT * FROM users').fetchArray().unique();
/*
Map (4) {
    11 => ['Claudio', 'male'],
    12 => ['Enrico', 'male'],
    13 => ['Nicola', 'male'],
    14 => ['Max', 'male'],
}
*/
```

here you get the data array indexed by id (Note that the first column selected have to be unique. In this query it is assumed that first column is id, but to be sure better list it up explicitly). Or you can use any other unique field as well:

```ts
const data = (await pdo.query('SELECT name, users.* FROM users').fetchArray().unique();
/*
Map (4) {
    'Claudio' => [11, 'male']
    'Enrico' => [12, 'male']
    'Nicola' => [13, 'male']
    'Max' => [14, 'male']
}
*/
```

### Fetch Group

> **Note**
> Fetch group return a Map

This mode groups the returned rows into a nested array, where indexes will be unique values from the first column, and values will be arrays similar to ones returned by regular all(). The following code, for example, will separate user from gender an put them into different arrays:

```ts
const data = (await pdo.query('SELECT gender, name, id FROM users').fetchArray().group;
/*
Map(5) {
    'male': [
        [11, 'Claudio'],
        [12, 'Enrico'],
        [13, 'Nicola'],
        [14, 'Max'],
    ]
    'female': [
        [15, 'Valentina'],
        [16, 'Silvia'],
    ],
    'non-binary': [
        [17, 'Luca'],
        [18, 'Lucia'],
        [19, 'Andrea']
    ],
    'transgender: [
        [20, 'Marco'],
        [21, 'Giorgia']
    ],
    'prefer-not-to-respond': [
        [22, 'Matteo']
    ]
}
*/
```

So, this is the ideal solution for such a popular demand like "group events by date" or "group goods by category".

> **Note**
> in case you need to select all the fields, but group by not the first one, the first idea that sporings in the mind won't work:

```sql
SELECT gender, * FROM users
```

will return an error. To avoid it, just perpend the asterisk with the table name:

```sql
SELECT gender, users.* FROM users
```

now it works like a charm!

## Cursor

Every Time a row is fetched the cursor move forward or backward according to `ATTR_FETCH_DIRECTION`.\
The cursor always follow the direction until it found a Row.\
Cursor can be resetted through `PdoStatement.resetCursor()`.\
For a PdoStatement `ATTR_FETCH_DIRECTION` determines which row will be returned to the caller.

### FETCH_FORWARD

```ts

const stmt = pdo.query('SELECT id FROM users order by id desc');
// read data forwards
const fetch = stmt.fetchArray();

fetch.get();
/*
[1]
*/

for (const row of fetch)
    console.log(row);
}
/*
[2]
[3]
[4]
....
[22]
*/
fetch.get();
// undefined
stmt.resetCursor();
fetch.get();
/*
[1]
*/
```

### FETCH_BACKWARD

```ts
// read data backwards
const stmt = pdo.query('SELECT id FROM users order by id desc');
stmt.setAttribute(ATTR_FETCH_DIRECTION, FETCH_BACKWARD);
const fetch = stmt.fetchArray();

fetch.get()
/*
[22]
*/

for (const row of fetch)
    console.log(row);
}
/*
[21]
[20]
[19]
....
[1]
*/
fetch.get();
// undefined
stmt.resetCursor();
fetch.get();
/*
[22]
*/
```
