import { parser } from "parser-ts"
import * as parserArgs from "./args"

export const optional = parser.optional(parserArgs.argument)

export const required = parser.cut(parserArgs.argument)
