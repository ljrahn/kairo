import { parseProgram } from "~/dsl";
import { checkProgramFunctionConstraints } from "~/validation";
import { expectOkR } from "~/test";

export function validate(expression: string) {
  const ast = expectOkR(parseProgram(expression));
  return checkProgramFunctionConstraints(ast);
}
