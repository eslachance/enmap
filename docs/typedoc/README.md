---
icon: code
expanded: true
order: 90
---

# API Reference

Complete TypeScript API documentation for Enmap with full type information.

:::hint{type="info"}
This documentation is automatically generated from the TypeScript source code and includes complete type signatures, generics, and cross-references.
:::

## Quick Navigation

### Core Classes
- **[Enmap Class](classes/default.md)** - Main database class with all methods

### Interfaces  
- **[EnmapOptions](interfaces/EnmapOptions.md)** - Configuration options for Enmap

---

## Key Features

### TypeScript Support
- **Full type safety** with generics `Enmap<V, SV>`
- **Custom types** like `Path<T>` for nested object access
- **Precise return types** and parameter validation

### Method Categories

#### Core Operations
- `set()`, `get()`, `has()`, `delete()`, `clear()`
- Type-safe with optional path parameters

#### Array Operations  
- `push()`, `includes()`, `remove()` 
- Full array method equivalents: `map()`, `filter()`, `find()`, etc.

#### Mathematical Operations
- `math()`, `inc()`, `dec()`
- Type-constrained to numeric values

#### Advanced Features
- `observe()` - Reactive objects that auto-save
- `ensure()` - Type-safe default value assignment  
- `update()` - React-style object merging

---

:::tip{type="success"}
The TypeScript API documentation includes live examples, full method signatures, and links to source code for every feature.
:::
