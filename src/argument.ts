import { Newtype, iso as iso_ } from "newtype-ts";
import * as cli from "./cli";

export interface Argument<A>
  extends Newtype<{ readonly Argument: unique symbol }, cli.Cli<A>> {}

/**
 * @internal
 */
export const iso = <A>() => iso_<Argument<A>>();
