import { argv } from "process"
import { io } from "./fp"

export const argvNode: io.IO<ReadonlyArray<string>> = () => argv.slice()
