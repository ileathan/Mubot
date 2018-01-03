# Mubot-Flatten

This is a fork of `npm install flat` with the following modifications:

1.) Removed unflatten.

2.) Return only the keys, or only the values.

3.) Filter against `{filter: RegExp}` or for values `{filter:{values: RegExp}}`

4.) Added a maxCount options `{maxCount: Integer}` that helps against massive objects. For example with maxCount at 1 if the object contains:

```{a:{b:1,c:2,d:3}}``` then the return value will be `a.b` because `a.c` and `a.d` make the maxCount = 2 and 3 respectivly.
