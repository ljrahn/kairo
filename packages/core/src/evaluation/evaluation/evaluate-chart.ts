import { err, ok, type Result } from "neverthrow";
import {
  createChart,
  type IChart,
  type IDomain,
  type IDomainType,
  type IPoint,
} from "../../domain";
import { EvaluationError } from "../errors";

export function evaluateChartBinaryArithmetic(
  op: "+" | "-" | "*" | "/",
  left: IChart,
  right: IChart
): Result<IChart, EvaluationError> {
  if (!chartsAreAligned(left, right)) {
    return err(
      new EvaluationError(
        "Chart arithmetic requires aligned charts with identical domain points",
        "Charts must be aligned before arithmetic; use align() or resample() first",
        "chart arithmetic alignment"
      )
    );
  }

  const points: IPoint[] = [];

  const leftPoints = left.points;
  const rightPoints = right.points;

  for (let i = 0; i < leftPoints.length; i++) {
    const leftPoint = leftPoints[i]!;
    const rightPoint = rightPoints[i]!;

    points.push({
      x: leftPoint.x,
      y: applyBinaryOp(op, leftPoint.y, rightPoint.y),
    });
  }

  return ok(createChart(left.domain, points));
}

export function evaluateChartScalarArithmetic(
  op: "+" | "-" | "*" | "/",
  chart: IChart,
  scalar: number,
  scalarOnLeft: boolean
): IChart {
  const points: IPoint[] = chart.points.map((point) => ({
    x: point.x,
    y: applyScalarOp(op, scalar, point.y, scalarOnLeft),
  }));

  return createChart(chart.domain, points);
}

function chartsAreAligned(left: IChart, right: IChart): boolean {
  if (!domainsAreCompatible(left.domain, right.domain)) {
    return false;
  }

  const leftPoints = left.points;
  const rightPoints = right.points;

  if (leftPoints.length !== rightPoints.length) {
    return false;
  }

  if (leftPoints.length === 0 && rightPoints.length === 0) {
    return true;
  }

  const domainType = left.domain.type;

  for (let i = 0; i < leftPoints.length; i++) {
    const leftPoint = leftPoints[i]!;
    const rightPoint = rightPoints[i]!;

    if (!domainValuesEqual(domainType, leftPoint.x, rightPoint.x)) {
      return false;
    }
  }

  return true;
}

function domainsAreCompatible(left: IDomain, right: IDomain): boolean {
  if (left.type !== right.type) {
    return false;
  }

  if (left.type === "time") {
    return left.timeZone === right.timeZone;
  }

  if (left.type === "numeric") {
    return left.unit === right.unit;
  }

  return true;
}

function domainValuesEqual(
  domainType: IDomainType,
  left: unknown,
  right: unknown
): boolean {
  if (domainType === "time") {
    const leftTime = (left as Date).getTime();
    const rightTime = (right as Date).getTime();
    return leftTime === rightTime;
  }

  return left === right;
}

function applyBinaryOp(
  op: "+" | "-" | "*" | "/",
  left: number,
  right: number
): number {
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
  }
}

function applyScalarOp(
  op: "+" | "-" | "*" | "/",
  scalar: number,
  value: number,
  scalarOnLeft: boolean
): number {
  if (scalarOnLeft) {
    return applyBinaryOp(op, scalar, value);
  }

  return applyBinaryOp(op, value, scalar);
}
