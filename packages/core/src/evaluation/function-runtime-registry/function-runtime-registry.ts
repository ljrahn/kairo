import { err, ok } from "neverthrow";
import { invariant } from "../../utils";
import {
  type IFunctionName,
  shiftTimeSeries,
  movingAverageTimeSeries,
  normalizeTimeSeries,
  resampleTimeSeries,
  alignTimeSeries,
  filterTimeSeries,
  type IResampleMethod,
  type IAlignMethod,
} from "../../functions";
import type { IEvalContext, IRuntimeValue } from "../types";
import { EvaluationError } from "../errors";
import { IRuntimeFunctionEntry } from "./types";

const runtimeFunctions: { [K in IFunctionName]: IRuntimeFunctionEntry } = {
  moving_avg: {
    impl: (_call, args, _evalCtx, _evalExpr) => {
      const [chartArg, windowArg] = args;

      invariant(
        chartArg?.kind === "chart",
        "Type checker should ensure first argument to moving_avg is a chart"
      );
      invariant(
        windowArg?.kind === "duration",
        "Type checker should ensure second argument to moving_avg is a duration"
      );

      const resultChart = movingAverageTimeSeries(
        chartArg.value,
        windowArg.value
      );
      return ok({ kind: "chart", value: resultChart });
    },
  },

  shift: {
    impl: (_call, args, _evalCtx, _evalExpr) => {
      const [chartArg, offsetArg] = args;
      invariant(
        chartArg?.kind === "chart",
        "Type checker should ensure first argument to shift is a chart"
      );
      invariant(
        offsetArg?.kind === "duration",
        "Type checker should ensure second argument to shift is a duration"
      );

      const resultChart = shiftTimeSeries(chartArg.value, offsetArg.value);
      return ok({ kind: "chart", value: resultChart });
    },
  },

  normalize: {
    impl: (_call, args, _evalCtx, _evalExpr) => {
      const chartArg = args[0];
      invariant(
        chartArg?.kind === "chart",
        "Type checker should ensure first argument to normalize is a chart"
      );

      const resultChart = normalizeTimeSeries(chartArg.value);
      return ok({ kind: "chart", value: resultChart });
    },
  },

  align: {
    impl: (_call, args, _evalCtx, _evalExpr) => {
      const [sourceArg, targetArg, methodArg] = args;

      invariant(
        sourceArg?.kind === "chart",
        "Type checker should ensure first argument to align is a chart"
      );
      invariant(
        targetArg?.kind === "chart",
        "Type checker should ensure second argument to align is a chart"
      );

      let method: IAlignMethod | undefined;

      if (methodArg) {
        invariant(
          methodArg.kind === "string",
          "Type checker should ensure third argument to align is a string when provided"
        );
        method = methodArg.value as IAlignMethod;
      }

      const resultChart = alignTimeSeries(
        sourceArg.value,
        targetArg.value,
        method
      );

      return ok({ kind: "chart", value: resultChart });
    },
  },

  resample: {
    impl: (_call, args, _evalCtx, _evalExpr) => {
      const [chartArg, windowArg, methodArg] = args;

      invariant(
        chartArg?.kind === "chart",
        "Type checker should ensure first argument to resample is a chart"
      );
      invariant(
        windowArg?.kind === "duration",
        "Type checker should ensure second argument to resample is a duration"
      );

      let method: IResampleMethod | undefined;

      if (methodArg) {
        invariant(
          methodArg.kind === "string",
          "Type checker should ensure third argument to resample is a string when provided"
        );
        method = methodArg.value as IResampleMethod;
      }

      const resultChart = resampleTimeSeries(
        chartArg.value,
        windowArg.value,
        method
      );

      return ok({ kind: "chart", value: resultChart });
    },
  },

  filter: {
    impl: (call, args, evalCtx, evalExpr) => {
      const [chartArg] = args;

      invariant(
        chartArg?.kind === "chart",
        "Type checker should ensure first argument to filter is a chart"
      );

      const predicateExpr = call.args[1];

      invariant(
        predicateExpr !== undefined,
        "Type checker should ensure filter has a predicate argument"
      );

      let error: EvaluationError | undefined;

      const resultChart = filterTimeSeries(chartArg.value, (point) => {
        if (error) {
          return false;
        }

        const mergedVariables = new Map<string, IRuntimeValue>();

        if (evalCtx.variables) {
          for (const [key, value] of evalCtx.variables) {
            mergedVariables.set(key, value);
          }
        }

        mergedVariables.set("time", { kind: "time", value: point.x });
        mergedVariables.set("value", { kind: "number", value: point.y });

        const predicateContext: IEvalContext = {
          ...evalCtx,
          variables: mergedVariables,
        };

        const predicateResultR = evalExpr(predicateExpr, predicateContext);

        if (predicateResultR.isErr()) {
          error = predicateResultR.error;
          return false;
        }

        const predicateValue = predicateResultR.value;

        invariant(
          predicateValue.kind === "boolean",
          "Type checker should ensure filter predicate is boolean"
        );

        return predicateValue.value;
      });

      if (error) {
        return err(error);
      }

      return ok({ kind: "chart", value: resultChart });
    },

    evaluateArgs: (call, evalCtx, evalExpr) => {
      const chartArgExpr = call.args[0];

      invariant(
        chartArgExpr !== undefined,
        "Type checker should ensure filter has a chart argument"
      );

      const chartArgValueR = evalExpr(chartArgExpr, evalCtx);

      if (chartArgValueR.isErr()) {
        return err(chartArgValueR.error);
      }

      return ok([chartArgValueR.value]);
    },
  },

  now: {
    impl: (_call, _args, context, _evalExpr) => {
      const nowValue = context.now();
      return ok({ kind: "time", value: nowValue });
    },
  },
};

export const FunctionRuntimeRegistry: ReadonlyMap<
  IFunctionName,
  IRuntimeFunctionEntry
> = new Map<IFunctionName, IRuntimeFunctionEntry>(
  Object.entries(runtimeFunctions) as [IFunctionName, IRuntimeFunctionEntry][]
);
