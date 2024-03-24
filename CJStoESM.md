I'm not going to describe all of the process here, but the gist of it goes something like this
(credit to `qrpx` on The Programmer's Hangout for the reference):

```diff
- const AModule = require("a-module")
+ import AModule from "a-module";

- const { AModule } = require("a-module");
+ import { AModule } from "a-module";

- module.exports = AnExport;
+ export default AnExport;

- module.exports = { Export1, Export2 };
+ export default { Export1, Export2 };

- module.exports.Export1 = Export1;
+ export { Export1 };

- module.exports = require("a-module");
+ export Export from "a-module";
+ export * from "a-module";

- module.exports = require("a-module").Export;
+ export { Export } from "a-module";

- module.exports = {
-   myvar1: "String1",
-   mayVar2: "String2"
- }
+ export const myVar1 = "String1";
+ export const myVar2 = "String2";

- require("my-file")(myvar);
+ (await import(`my-file`)).default(myVar);
```

Renaming:
```diff
- const renamed = require("name");
+ import name as renamed from "name";

- const { name: renamed } = require("name");
+ import { name as renamed } from "name";

- module.exports.Export1 = Export2;
+ export { Export2 as Export1 };
```


Advantages over CommonJS
```diff
- const EntireModule = require("a-module");
- const APartOfIt = require("a-module").part;

+ import EntireModule, { part as APartOfIt } from "a-module";
```
