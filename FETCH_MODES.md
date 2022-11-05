# Npdo Fetch Modes

-   Classic Modes:
    -   [Npdo.FETCH_BOTH](#npdofetch_both)
    -   [Npdo.FETCH_NUM](#npdofetch_num)
    -   [Npdo.FETCH_ASSOC](#npdofetch_assoc)
-   Most useful modes:
    -   [Npdo.FETCH_COLUMN](#npdofetch_column)
    -   [Npdo.FETCH_KEY_PAIR](#npdofetch_key_pair)
    -   [Npdo.FETCH_UNIQUE](#npdofetch_unique)
    -   [Npdo.FETCH_GROUP](#npdofetch_group)
-   OOP:
    -   [Npdo.FETCH_CLASS](#npdofetch_class)
    -   [Npdo.FETCH_CLASSTYPE](#npdofetch_classtype)
    -   [Npdo.FETCH_INTO](#npdofetch_into)
-   Miscellaneous
    -   [Npdo.FETCH_FUNC](#npdofetch_func)
    -   [Npdo.FETCH_NAMED](#npdofetch_named)
-   [Cursors Orientation](#cursor-orientation)
    -   [FETCH_ORI_NEXT](#npdofetch_ori_next)
    -   [FETCH_ORI_PRIOR](#npdofetch_ori_prior)
    -   [FETCH_ORI_FIRST](#npdofetch_ori_first)
    -   [FETCH_ORI_LAST](#npdofetch_ori_last)

## Npdo.FETCH_BOTH

The row is returned in the form of object, where data is duplicated, to be accessed via both numeric and key indexes.

```js
const user = (await npdo.query("SELECT * from users LIMIT 1").fetch(Npdo.FETCH_BOTH);
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

## Npdo.FETCH_NUM

The row is returned in the form of array. This mode is set by default.

```js
const user = (await npdo.query("SELECT * from users LIMIT 1").fetch(Npdo.FETCH_NUM);
/*
[
    11,
    'Claudio',
    'male'
]
*/
```

## Npdo.FETCH_ASSOC

The row is returned in the form of object. See also [Npdo.FETCH_NAMED](#npdofetch_named)

```js
const user = (await npdo.query("SELECT * from users LIMIT 1").fetch(Npdo.FETCH_ASSOC);
/*
{
    'id' : 11,
    'name' : 'Claudio'
    'gender' : 'male',
}
*/
```

## Npdo.FETCH_COLUMN

It is often very handy to get plain one-dimensional array right out of the query, if only one column out of many rows being fetched. Here you go:

```js
const data = (await npdo.query("SELECT name FROM users").fetchAll(Npdo.FETCH_COLUMN);
/*
[
    'Claudio',
    'Enrico',
    'Nicola',
    'Max'
]
*/
```

## Npdo.FETCH_KEY_PAIR

Also extremely useful format, when we need to get the same column as above, but indexed not by numbers in order but by an unique field:

```js
const data = (await npdo.query("SELECT name, gender FROM users").fetchAll(Npdo.FETCH_KEY_PAIR);
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
const data = (await npdo.query("SELECT gender, count(*) FROM users GROUP BY gender").fetchAll(Npdo.FETCH_KEY_PAIR);
/*
{
    'male' : 4,
    'female': 2,
    'non-binary': 3,
    'transgender': 2,
    'prefer-not-to-respond' : 1
}
```

## Npdo.FETCH_UNIQUE

Same as above, but getting not one column but full row, yet indexed by an unique field

```js
const data = (await npdo.query('SELECT * FROM users').fetchAll(Npdo.FETCH_UNIQUE);
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
const data = (await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE);
/*
{
    'Claudio' : [11, 'male']
    'Enrico' : [12, 'male']
    'Nicola' : [13, 'male']
    'Max' : [14, 'male']
}
*/
```

> This mode could be combined with Npdo.FETCH_ASSOC, Npdo.FETCH_BOTH, Npdo.FETCH_COLUMN, Npdo.FETCH_COLUMN, Npdo.FETCH_INTO, NPDO.FETCH_CLASS

```js
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_ASSOC);
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_BOTH);
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_COLUMN);
npdo.setFetchMode(Npdo.FETCH_COLUMN, 2);
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_COLUMN);
(await npdo.query("SELECT name, 'User', users.* FROM users").fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_CLASS | Npdo.FETCH_CLASS_TYPE);
class Test {}
npdo.setFetchMode(Npdo.FETCH_INTO, new Test());
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_INTO);
npdo.setFetchMode(Npdo.FETCH_CLASS, Test);
(await npdo.query('SELECT name, users.* FROM users').fetchAll(Npdo.FETCH_UNIQUE | Npdo.FETCH_CLASS);
```

## Npdo.FETCH_GROUP

This mode groups the returned rows into a nested array, where indexes will be unique values from the first column, and values will be arrays similar to ones returned by regular fetchAll(). The following code, for example, will separate user from gender an put them into different arrays:

```js
const data = (await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP);
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

> This mode could be combined with Npdo.FETCH_ASSOC, Npdo.FETCH_BOTH, Npdo.FETCH_COLUMN, Npdo.FETCH_COLUMN, Npdo.FETCH_INTO, NPDO.FETCH_CLASS

```js
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_ASSOC);
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_BOTH);
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_COLUMN);
npdo.setFetchMode(Npdo.FETCH_COLUMN, 2);
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_COLUMN);
(await npdo.query("SELECT gender, 'User', name, id FROM users").fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_CLASS | Npdo.FETCH_CLASS_TYPE);
class Test {}
npdo.setFetchMode(Npdo.FETCH_INTO, new Test());
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_INTO);
npdo.setFetchMode(Npdo.FETCH_CLASS, Test);
(await npdo.query('SELECT gender, name, id FROM users').fetchAll(Npdo.FETCH_GROUP | Npdo.FETCH_CLASS);
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

## Npdo.FETCH_CLASS

The cornerstone of object manipulation in Npdo. Creates an instance of a class with a given name, mapping returned columns to the class' properties. This mode can be used to get either a single row or an array of rows from database. With fetchAll() the approach is quite familiar:

```js
class User {}
const users = npdo.query('SELECT name FROM users').fetchAll(Npdo.FETCH_CLASS, User);
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
const stmt = npdo.query('SELECT name FROM users LIMIT 1');
stmt.setFetchMode(Npdo.FETCH_CLASS, User);
user = stmt.fetch();
```

it is recommended to use a dedicated fetchObject() method:

```js
class User {}
const user = npdo.query('SELECT name FROM users LIMIT 1').fetchObject(User);
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
const user = npdo.query('SELECT * FROM users LIMIT 1').fetchObject(User);
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
const user = npdo.query('SELECT * FROM users LIMIT 1').fetchObject(User);
/*
User {
    // #name: 'Claudio'
    id: 11,
    gender: 'mal'
}
*/
```

As you can see, in this mode Npdo can assign values to private properties as well. Which is a bit unexpected but extremely useful.

Of course, for the newly created classes we may want to supply constructor parameters. So, let's add them to the examples above:

```js
class User {
    constructor(car) {
        this.car = car;
    }
}
const users = npdo.query('SELECT name FROM users LIMIT 1').fetchAll(Npdo.FETCH_CLASS, User, ['Tesla']);
// or using fetch()
const stmt = npdo.query('SELECT name FROM users LIMIT 1');
// stmt.setFetchMode(Npdo.FETCH_CLASS, User, ['Tesla']);
// const user = stmt.fetch();
const user = stmt.fetchObject(Npdo.FETCH_CLASS, User, ['Tesla']);
```

will give you

```js
User {
    name: 'Claudio'
    car: 'Tesla'
}
```

## Npdo.FETCH_CLASSTYPE

One more modifier flag which tells Npdo to get the class name from the first column's value. With this flag one can avoid using setFetchMode() with fetch():

```js
const data = npdo.query("SELECT 'User', name FROM users").fetch(Npdo.FETCH_CLASS | Npdo.FETCH_CLASSTYPE);
/*
User {
    'name' : 'Claudio
}
*/
```

Besides, as it was noted in the comments to the main article, this mode can be useful if objects of different classes can be created from the same query

```js
const stmt = npdo.query('SELECT gender, name FROM users');
const users = stmt.fetchAll(Npdo.FETCH_CLASS | Npdo.FETCH_CLASSTYPE);
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

## Npdo.FETCH_INTO

Unlike `Npdo.FETCH_CLASS`, doesn't create a new object but update the existing one. Works with `setFetchMode()` only, which takes the existing variable as a parameter.

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
const stmt = npdo.query('SELECT name FROM users LIMIT 1');
stmt.setFetchMode(Npdo.FETCH_INTO, user);
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

Unlike Npdo.FETCH_CLASS, this mode assign property only if property/setter are defined.

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
const stmt = npdo.query('SELECT name FROM users LIMIT 3');
const users = stmt.fetchAll(Npdo.FETCH_INTO | user);

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

## Npdo.FETCH_FUNC

For the closure lovers. Not very convenient as you should list parameters for the every returned column manually. For example, a Npdo.FETCH_COLUMN emulator:

```js
data = npdo.query('SELECT name FROM users').fetchAll(Pdo.FETCH_FUNC, function (first) {
    return first;
});
```

## Npdo.FETCH_NAMED
Almost exactly the same as `Npdo.FETCH_ASSOC`, but with one little difference. Many times I've seen a question, whether it's possible to distinguish different fields with the same names that returned by same query. With the only answer is using aliases in SQL or numeric indices instead of associative. However, Npdo offers another way. If this mode is used, returned values are assigned the same way as with `Npdo.FETCH_ASSOC`, but if there are several columns with the same name in the result set, all values are stored in the nested array. For example, let's try to select from users and companies, while both tables has a column name. Using `Npdo.FETCH_ASSOC`, we'll lose one of the names:

```js
const data = npdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetch(Npdo.FETCH_ASSOC);
/*
{
  'name' => 'Lupennat srl'
  'gender' => 'male
}
*/
```

While if `Npdo.FETCH_NAMED` is used instead, everything will be kept intact:

```js
const data = npdo.query("SELECT name, gender FROM users, companies WHERE users.name = 'Claudio'").fetch(Npdo.FETCH_NAMED);
/*
{
    'name': ['Claudio', 'Lupennat srl'],
    'gender' : 'male'
}
*/
```

## Cursor Orientation

For a NpdoStatement cursorOrientation determines which row will be returned to the caller. This value must be one of the Npdo.FETCH*ORI*\* constants, defaulting to Npdo.FETCH_ORI_NEXT.

### Npdo.FETCH_ORI_NEXT

```js
// read data forwards
const query = npdo.query('SELECT id FROM users order by id desc');
let row;
while ((row = stmt.fetch(Npdo.FETCH_NUM, Npdo.FETCH_ORI_NEXT))) {
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

### Npdo.FETCH_ORI_PRIOR

```js
// read data backwards
const query = npdo.query('SELECT id FROM users order by id desc');
let row = stmt.fetch(Npdo.FETCH_NUM, Npdo.FETCH_ORI_LAST);
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

### Npdo.FETCH_ORI_FIRST

Fetch the first row in the results set. Cursor will be moved to first row.

```js
const query = npdo.query('SELECT id FROM users order by id desc');
let row;
while ((row = stmt.fetch(Npdo.FETCH_NUM))) {
    // console.log(row);
}
row = stmt.fetch(Npdo.FETCH_NUM);
console.log(row);
// null
row = stmt.fetch(Npdo.FETCH_NUM, Npdo.FETCH_ORI_FIRST);
console.log(row);
// [1]
while ((row = stmt.fetch(Npdo.FETCH_NUM))) {
    console.log(row);
}
/*
[2]
[3]
[4]
[5]
*/
```

### Npdo.FETCH_ORI_LAST

Fetch the last row in the result set. Cursor will be moved to last row.

```js
const query = npdo.query('SELECT id FROM users order by id desc');
let row = stmt.fetch(Npdo.FETCH_NUM, Npdo.FETCH_ORI_LAST);
console.log(row);
// [22]
row = stmt.fetch(Npdo.FETCH_NUM);
console.log(row);
// null
```
