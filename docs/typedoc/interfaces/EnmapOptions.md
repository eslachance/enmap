[**Enmap API Reference v6.1.3**](../README.md)

***

[Enmap API Reference](../README.md) / EnmapOptions

# EnmapOptions (V, SV)

Defined in: [index.ts:29](https://github.com/eslachance/enmap/blob/main/src/index.ts#L29)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `V` | `unknown` |
| `SV` | `unknown` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="name"></a> `name?` | `string` | [index.ts:30](https://github.com/eslachance/enmap/blob/main/src/index.ts#L30) |
| <a id="datadir"></a> `dataDir?` | `string` | [index.ts:31](https://github.com/eslachance/enmap/blob/main/src/index.ts#L31) |
| <a id="ensureprops"></a> `ensureProps?` | `boolean` | [index.ts:32](https://github.com/eslachance/enmap/blob/main/src/index.ts#L32) |
| <a id="autoensure"></a> `autoEnsure?` | `V` | [index.ts:33](https://github.com/eslachance/enmap/blob/main/src/index.ts#L33) |
| <a id="serializer"></a> `serializer?` | (`value`, `key`) => `SV` | [index.ts:34](https://github.com/eslachance/enmap/blob/main/src/index.ts#L34) |
| <a id="deserializer"></a> `deserializer?` | (`value`, `key`) => `V` | [index.ts:35](https://github.com/eslachance/enmap/blob/main/src/index.ts#L35) |
| <a id="inmemory"></a> `inMemory?` | `boolean` | [index.ts:36](https://github.com/eslachance/enmap/blob/main/src/index.ts#L36) |
| <a id="sqliteoptions"></a> `sqliteOptions?` | `Options` | [index.ts:37](https://github.com/eslachance/enmap/blob/main/src/index.ts#L37) |
