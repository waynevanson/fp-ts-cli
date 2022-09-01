# fp-ts-cli

## Notes

- Argument is own structure
- Flag is own structure, and can be composed with an argument (like a lens)
- Command is own structure, and can be composed with flags and arguments
- Commands can take many of other commands

## Examples

### Flags

#### Booleans

When a flag is specified and takes no arguments, its value is `true`.

```
<bin> -f
<bin> -f=true
<bin> -f true
<bin> --force
<bin> --force true
<bin> --force=true
```

When a flag is unspecified and takes no arguments, it's value is `false`.
It can also take the flag with the value `false`

```
<bin> -f false
<bin> -f=false
<bin> --force false
<bin> --force=false
```

#### Arguments

Arguments default to the values they're provided: `string`.

```
<bin>
```

#### Optional

Arguments are required. If you have a default value, it needs to be specified.
