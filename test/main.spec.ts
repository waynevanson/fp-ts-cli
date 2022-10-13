import { constVoid, pipe } from "fp-ts/lib/function"
import { flag, command, cli } from "../src"

const flagOne = pipe(
  flag.long("flag-one"),
  flag.argumentless(true as const),
  flag.required
)

const cmd1 = command.flags({ flagOne })
const cmd2 = command.flags({ flagOne })

const commands = command.subcommands({ cmd1, cmd2 })
