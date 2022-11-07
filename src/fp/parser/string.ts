export * from "parser-ts/string"

import { char, string, stream as stream_ } from "parser-ts"
import * as parser from "./parser"

export const dash = char.char("-")

export const doubleDash = string.string("--")

export const kebabCase = parser.sepBy1(dash, parser.many1(char.lower))

export const stream = (string: string) => stream_.stream(string.split(""))
