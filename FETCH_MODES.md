#  Fetch Modes

-   Classic Modes:
    -   [FETCH_BOTH](#fetch_both)
    -   [FETCH_NUM](#fetch_num)
    -   [FETCH_ASSOC](#fetch_assoc)
-   Most useful modes:
    -   [FETCH_COLUMN](#fetch_column)
    -   [FETCH_KEY_PAIR](#fetch_key_pair)
    -   [FETCH_UNIQUE](#fetch_unique)
    -   [FETCH_GROUP](#fetch_group)
-   OOP:
    -   [FETCH_CLASS](#fetch_class)
    -   [FETCH_CLASSTYPE](#fetch_classtype)
    -   [FETCH_INTO](#fetch_into)
-   Miscellaneous
    -   [FETCH_FUNC](#fetch_func)
    -   [FETCH_NAMED](#fetch_named)
-   [Cursors Orientation](#cursor-orientation)
    -   [FETCH_ORI_NEXT](#fetch_ori_next)
    -   [FETCH_ORI_PRIOR](#fetch_ori_prior)
    -   [FETCH_ORI_FIRST](#fetch_ori_first)
    -   [FETCH_ORI_LAST](#fetch_ori_last)

## FETCH_BOTH

The row is returned in the form of object, where data is duplicated, to be accessed via both numeric and key indexes.

```js
const user = (await pdo.query("SELECT * from users LIMIT 1").fetch(FETCH_BOTH);
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

## FETCH_NUM

The row is returned in the form of array. This mode is set by default.

```js
const user = (await pdo.query("SELECT * from users LIMIT 1").fetch(FETCH_NUM);
/*
[
    11,
    'Claudio',
    'male'
]
*/
```

## FETCH_ASSOC

The row is returned in the form of object. See also [FETCH_NAMED](#fetch_named)

```js
const user = (await pdo.query("SELECT * from users LIMIT 1").fetch(FETCH_ASSOC);
/*
{
    'id' : 11,
    'name' : 'Claudio'
    'gender' : 'male',
}
*/
```

## FETCH_COLUMN

It is often very handy to get plain one-dimensional array right out of the query, if only one column out of many rows being fetched. Here you go:

```js
const data = (await pdo.query("SELECT name FROM users").fetchAll(FETCH_COLUMN);
/*
[
    'Claudio',
    'Enrico',
    'Nicola',
    'Max'
]
*/
```

## FETCH_KEY_PAIR

Also extremely useful format, when we need to get the same column as above, but indexed not by numbers in order but by an unique field:

```js
const data = (await pdo.query("SELECT name, gender FROM users").fetchAll(FETCH_KEY_PAIR);
/*
{
    'Claudio' : 'male',
    'Enrico': 'male',
    'Nicola': 'male',
    'Max': 'male'
}
*/
```

The returned key-value format is excellent for the dictionary like data or simply for indexed values, like below

```js
const data = (await pdo.query("SELECT gender, count(*) FROM users GROUP BY gender").fetchAll(FETCH_KEY_PAIR);
/*
{
    'male' : 4,
    'female': 2,
    'non-binary': 3,
    'transgender': 2,
    'prefer-not-to-respond' : 1
}
```

## FETCH_UNIQUE

Same as above, but getting not one column but full row, yet indexed by an unique field

```js
const data = (await pdo.query('SELECT * FROM users').fetchAll(FETCH_UNIQUE);
/*
{
    '11' : ['Claudio', 'male'],
    '12' : ['Enrico', 'male'],
    '13' : ['Nicola', 'male'],
    '14' : ['Max', 'male'],
}
*/
```

here you get the data array indexed by id (Note that the first column selected have to be unique. In this query it is assumed that first column is id, but to be sure better list it up explicitly). Or you can use any other unique field as well:

```js
const data = (await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE);
/*
{
    'Claudio' : [11, 'male']
    'Enrico' : [12, 'male']
    'Nicola' : [13, 'male']
    'Max' : [14, 'male']
}
*/
```

> This mode could be combined with FETCH_ASSOC, FETCH_BOTH, FETCH_COLUMN, FETCH_COLUMN, FETCH_INTO, FETCH_CLASS

```js
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_ASSOC);
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_BOTH);
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_COLUMN);
pdo.setFetchMode(FETCH_COLUMN, 2);
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_COLUMN);
(await pdo.query("SELECT name, 'User', users.* FROM users").fetchAll(FETCH_UNIQUE | FETCH_CLASS | FETCH_CLASS_TYPE);
class Test {}
pdo.setFetchMode(FETCH_INTO, new Test());
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_INTO);
pdo.setFetchMode(FETCH_CLASS, Test);
(await pdo.query('SELECT name, users.* FROM users').fetchAll(FETCH_UNIQUE | FETCH_CLASS);
```

## FETCH_GROUP

This mode groups the returned rows into a nested array, where indexes will be unique values from the first column, and values will be arrays similar to ones returned by regular fetchAll(). The following code, for example, will separate user from gender an put them into different arrays:

```js
const data = (await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP);
/*
{
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

> This mode could be combined with FETCH_ASSOC, FETCH_BOTH, FETCH_COLUMN, FETCH_COLUMN, FETCH_INTO, FETCH_CLASS

```js
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_ASSOC);
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_BOTH);
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_COLUMN);
pdo.setFetchMode(FETCH_COLUMN, 2);
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_COLUMN);
(await pdo.query("SELECT gender, 'User', name, id FROM users").fetchAll(FETCH_GROUP | FETCH_CLASS | FETCH_CLASS_TYPE);
class Test {}
pdo.setFetchMode(FETCH_INTO, new Test());
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_INTO);
pdo.setFetchMode(FETCH_CLASS, Test);
(await pdo.query('SELECT gender, name, id FROM users').fetchAll(FETCH_GROUP | FETCH_CLASS);
```

**A hint**: in case you need to select all the fields, but group by not the first one, the first idea that sporings in the mind won't work:

```sql
SELECT gender, * FROM users
```

will return an error. To avoid it, just perpend the asterisk with the table name:

```sql
SELECT gender, users.* FROM users
```

now it works like a charm!

## FETCH_CLASS

The cornerstone of object manipulation in  Creates an instance of a class with a given name, mapping returned columns to the class' properties. This mode can be used to get either a single row or an array of rows from database. With fetchAll() the approach is quite familiar:

```js
class User {}
const users = pdo.query('SELECT name FROM users').fetchAll(FETCH_CLASS, User);
```

will give you an array consists of objects of a User class, with properties filled from returned data:

```js
[
    User {
        name: 'Claudio'
    },
    User {
        name: 'Enrico
    }
]
```

While to get a single row you have two options. However, although you could use the the familiar fetch() method, like shown below:

```js
class User {}
const stmt = pdo.query('SELECT name FROM users LIMIT 1');
stmt.setFetchMode(FETCH_CLASS, User);
user = stmt.fetch();
```

it is recommended to use a dedicated fetchObject() method:

```js
class User {}
const user = pdo.query('SELECT name FROM users LIMIT 1').fetchObject(User);
```

as there are several issues with using fetch() to get an object:

-   you cannot pass constructor parameters to a newly created object

obviously, the dedicated method takes less code to write.
No matter which method you choose, all the returned columns will be assigned to the corresponding class' properties according to the following rules:

-   if there is a class property, which name is the same as a column name, the column value will be assigned to this property.
-   if there is no such property, but exist a setter then the setter will be called.
-   if setter method is not defined for the class, then a public property will be created and a column value assigned to it.

Properties are always assigned after class constructor is called.

For example, this code

```js
class User {
    name;
}
const user = pdo.query('SELECT * FROM users LIMIT 1').fetchObject(User);
```

will give you an object with all the properties automatically assigned, no matter were they exist in the class or not:

```js
User {
    id: 11
    name: 'Claudio'
    gender: 'male'
},
```

From this you can tell that to avoid an automated property creation you need to use the setter method to filter the properties out.

```js
class User
{
    #name;
    public function name(value) {
        this.#name = value;
    }
}
const user = pdo.query('SELECT * FROM users LIMIT 1').fetchObject(User);
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

```js
class User {
    constructor(car) {
        this.car = car;
    }
}
const users = pdo.query('SELECT name FROM users LIMIT 1').fetchAll(FETCH_CLASS, User, ['Tesla']);
// or using fetch()
const stmt = pdo.query('SELECT name FROM users LIMIT 1');
// stmt.setFetchMode(FETCH_CLASS, User, ['Tesla']);
// const user = stmt.fetch();
const user = stmt.fetchObject(FETCH_CLASS, User, ['Tesla']);
```

will give you

```js
User {
    name: 'Claudio'
    car: 'Tesla'
}
```

## FETCH_CLASSTYPE

One more modifier flag which tells Pdo to get the class name from the first column's value. With this flag one can avoid using setFetchMode() with fetch():

```js
const data = pdo.query("SELECT 'User', name FROM users").fetch(FETCH_CLASS | FETCH_CLASSTYPE);
/*
User {
    'name' : 'Claudio
}
*/
```

Besides, as it was noted in the comments to the main article, this mode can be useful if objects of different classes can be created from the same query

```js
const stmt = pdo.query('SELECT gender, name FROM users');
const users = stmt.fetchAll(FETCH_CLASS | FETCH_CLASSTYPE);
/*
[
    Male {
        'name' : 'Claudio
    },
    Female {
        'name': 'Valentina'
    }
]
*/
```

## FETCH_INTO

Unlike `FETCH_CLASS`, doesn't create a new object but update the existing one. Works with `setFetchMode()` only, which takes the existing variable as a parameter.

```js
class User {
    name;
    state;

    constructor() {
        this.name = null;
    }
}
const user = new User();
user.state = "up'n'running";
console.log(user);
/*
User {
  name: null
  state: "up'n'running"
}
*/
const stmt = pdo.query('SELECT name FROM users LIMIT 1');
stmt.setFetchMode(FETCH_INTO, user);
const data = stmt.fetch();
console.log(data, user);
/*
User {
  name: 'Claudio'
  state: "up'n'running"
}
User {
  name: 'Claudio'
  state: "up'n'running"
}
*/
```

Unlike FETCH_CLASS, this mode assign property only if property/setter are defined.

convenient use of `fetchAll`, thanks to the use of setters.

```js
class User {
    names = [];

    set name(value) {
        this.names.push(value);
    }
}
const user = new User();
console.log(user);
/*
User {
  names: []
}
*/
const stmt = pdo.query('SELECT name FROM users LIMIT 3');
const users = stmt.fetchAll(FETCH_INTO | user);

console.log(users, user);
/*
User {
  names: ['Claudio', 'Enrico', 'Nicola]
}
User {
  names: ['Claudio', 'Enrico', 'Nicola]
}
*/
```

## FETCH_FUNC

For the closure lovers. Not very convenient as you should list parameters for the every returned column manually. For example, a FETCH_COLUMN emulator:

```js
data = pdo.query('SELECT name FROM users').fetchAll(Pdo.FETCH_FUNC, function (first) {
    return first;
});
```

## FETCH_NAMED
Almost exactly the same as `FETCH_ASSOC`, but with one little difference. Many times I've seen a question, whether it's possible to distinguish different fields with the same names that returned by same query. With the only answer is using aliases in SQL or numeric indices instead of associative. However, Pdo offers another way. If this mode is used, returned values are assigned the same way as with `FETCH_ASSOC`, but if there are several columns with the same name in the result set, all values are stored in the nested array. For example, let's try to select from users and companies, while both tables has a column name. Using `FETCH_ASSOC`, we'll lose one of the names:

```js
const data = pdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetch(FETCH_ASSOC);
/*
{
  'name' => 'Lupennat srl'
  'gender' => 'male
}
*/
```

While if `FETCH_NAMED` is used instead, everything will be kept intact:

```js
const data = pdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetch(FETCH_NAMED);
/*
{
    'name': ['Claudio', 'Lupennat srl'],
    'gender' : 'male'
}
*/
```

## Cursor Orientation

For a PdoStatement cursorOrientation determines which row will be returned to the caller. This value must be one of the FETCH*ORI*\* constants, defaulting to FETCH_ORI_NEXT.

### FETCH_ORI_NEXT

```js
// read data forwards
const query = pdo.query('SELECT id FROM users order by id desc');
let row;
while ((row = stmt.fetch(FETCH_NUM, FETCH_ORI_NEXT))) {
    console.log(row);
}
/*
[1]
[2]
[3]
[4]
....
*/
```

### FETCH_ORI_PRIOR

```js
// read data backwards
const query = pdo.query('SELECT id FROM users order by id desc');
let row = stmt.fetch(FETCH_NUM, FETCH_ORI_LAST);
do {
    console.log(row);
} while ((row = stmt.fetch(PDO::FETCH_NUM, PDO::FETCH_ORI_PRIOR)));

/*
[22]
[21]
[20]
[19]
....
*/
```

### FETCH_ORI_FIRST

Fetch the first row in the results set. Cursor will be moved to first row.

```js
const query = pdo.query('SELECT id FROM users order by id desc');
let row;
while ((row = stmt.fetch(FETCH_NUM))) {
    // console.log(row);
}
row = stmt.fetch(FETCH_NUM);
console.log(row);
// null
row = stmt.fetch(FETCH_NUM, FETCH_ORI_FIRST);
console.log(row);
// [1]
while ((row = stmt.fetch(FETCH_NUM))) {
    console.log(row);
}
/*
[2]
[3]
[4]
[5]
*/
```

### FETCH_ORI_LAST

Fetch the last row in the result set. Cursor will be moved to last row.

```js
const query = pdo.query('SELECT id FROM users order by id desc');
let row = stmt.fetch(FETCH_NUM, FETCH_ORI_LAST);
console.log(row);
// [22]
row = stmt.fetch(FETCH_NUM);
console.log(row);
// null
```
