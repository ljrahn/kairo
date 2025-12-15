import { Result } from "neverthrow";
import { ensureError } from "~/utils";
import { TestError } from "./test-error";

export function expectOkR<T extends unknown, E extends unknown>(
  result: Result<T, E>
): T {
  if (result.isErr()) {
    const error = result._unsafeUnwrapErr();
    throw new TestError(`Expected Ok result, got Err`, {
      cause: ensureError(error),
    });
  }

  return result._unsafeUnwrap();
}

export function expectErrR<T extends unknown, E extends unknown>(
  result: Result<T, E>
): E {
  if (result.isOk()) {
    throw new TestError("Expected Err parse result, got Ok", {
      context: { result: result._unsafeUnwrap() },
    });
  }
  return result._unsafeUnwrapErr();
}
