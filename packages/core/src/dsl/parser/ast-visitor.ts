import type { IToken } from "chevrotain";
import {
  createBooleanLiteral,
  createDuration,
  createDurationLiteral,
  createNumberLiteral,
  createStringLiteral,
} from "../../ast/literal";
import { createIdentifier } from "../../ast/identifier/identifier";
import { createBinaryExpression } from "../../ast/binary-expression/binary-expression";
import { createFunctionCall } from "../../ast/function-call/function-call";
import { createNamedArgument } from "../../ast/named-argument";
import type { IExpression } from "../../ast/expression";
import type { IBinaryOperator } from "../../ast/binary-expression";
import { invariant } from "../../utils";

/**
 * Creates an AST visitor that converts CST (Concrete Syntax Tree) to AST.
 *
 * Note on 'any' types:
 * - baseCstVisitorConstructor: Must be 'any' - comes from Chevrotain's dynamic visitor system
 * - ctx parameters: Must be 'any' - Chevrotain's CST structure is dynamic and doesn't have
 *   compile-time type definitions. The structure depends on the grammar rules.
 */
export function createAstVisitor(baseCstVisitorConstructor: any) {
  class AstVisitor extends baseCstVisitorConstructor {
    constructor() {
      super();
      this.validateVisitor();
    }

    expression(ctx: any): IExpression {
      return this.visit(ctx.orExpression);
    }

    orExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any) => {
          result = createBinaryExpression("or", result, this.visit(rhsOperand));
        });
      }
      return result;
    }

    andExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any) => {
          result = createBinaryExpression(
            "and",
            result,
            this.visit(rhsOperand)
          );
        });
      }
      return result;
    }

    comparisonExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs && ctx.rhs.length > 0) {
        const operatorFlags = [
          !!ctx.GreaterThanEqual,
          !!ctx.LessThanEqual,
          !!ctx.GreaterThan,
          !!ctx.LessThan,
          !!ctx.Equal,
        ];

        invariant(
          ctx.rhs.length === 1 && operatorFlags.filter(Boolean).length === 1,
          "comparisonExpression CST invariant violated",
          { rhsLength: ctx.rhs.length, operatorFlags }
        );

        let operator: IBinaryOperator = "==";
        if (ctx.GreaterThanEqual) operator = ">=";
        else if (ctx.LessThanEqual) operator = "<=";
        else if (ctx.GreaterThan) operator = ">";
        else if (ctx.LessThan) operator = "<";
        else if (ctx.Equal) operator = "==";

        result = createBinaryExpression(
          operator,
          result,
          this.visit(ctx.rhs[0])
        );
      }
      return result;
    }

    additionExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any, idx: number) => {
          const hasPlus = !!(ctx.Plus && ctx.Plus[idx]);
          const hasMinus = !!(ctx.Minus && ctx.Minus[idx]);

          invariant(
            hasPlus !== hasMinus,
            "additionExpression CST invariant violated",
            { index: idx, hasPlus, hasMinus }
          );

          const operator: IBinaryOperator = hasPlus ? "+" : "-";
          result = createBinaryExpression(
            operator,
            result,
            this.visit(rhsOperand)
          );
        });
      }
      return result;
    }

    multiplicationExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any, idx: number) => {
          const hasMultiply = !!(ctx.Multiply && ctx.Multiply[idx]);
          const hasDivide = !!(ctx.Divide && ctx.Divide[idx]);

          invariant(
            hasMultiply !== hasDivide,
            "multiplicationExpression CST invariant violated",
            { index: idx, hasMultiply, hasDivide }
          );

          const operator: IBinaryOperator = hasMultiply ? "*" : "/";
          result = createBinaryExpression(
            operator,
            result,
            this.visit(rhsOperand)
          );
        });
      }
      return result;
    }

    unaryExpression(ctx: any): IExpression {
      if (ctx.Not) {
        const operand = this.visit(ctx.unaryExpression);
        return createFunctionCall("not", [operand]);
      }
      return this.visit(ctx.primaryExpression);
    }

    primaryExpression(ctx: any): IExpression {
      if (ctx.literal) return this.visit(ctx.literal);
      if (ctx.functionCall) return this.visit(ctx.functionCall);
      if (ctx.identifier) return this.visit(ctx.identifier);
      if (ctx.parenthesizedExpression)
        return this.visit(ctx.parenthesizedExpression);

      invariant(false, "Invalid primaryExpression CST shape", {
        ctxKeys: Object.keys(ctx ?? {}),
      });
    }

    literal(ctx: any): IExpression {
      if (ctx.NumberLiteral) {
        const token: IToken = ctx.NumberLiteral[0];
        return createNumberLiteral(parseFloat(token.image));
      }
      if (ctx.BooleanLiteral) {
        const token: IToken = ctx.BooleanLiteral[0];
        return createBooleanLiteral(token.image === "true");
      }
      if (ctx.StringLiteral) {
        const token: IToken = ctx.StringLiteral[0];
        return createStringLiteral(JSON.parse(token.image));
      }
      if (ctx.DurationLiteral) {
        const token: IToken = ctx.DurationLiteral[0];
        const match = token.image.match(/^(\d+)(ms|[smhdw])$/);

        invariant(
          !!match && !!match[1] && !!match[2],
          "DurationLiteral token did not match expected pattern",
          { image: token.image }
        );

        const value = parseInt(match[1], 10);
        const unit = match[2] as "ms" | "s" | "m" | "h" | "d" | "w";
        return createDurationLiteral(createDuration(value, unit));
      }

      invariant(false, "Invalid literal CST shape", {
        ctxKeys: Object.keys(ctx ?? {}),
      });
    }

    identifier(ctx: any): IExpression {
      const token: IToken = ctx.Identifier[0];
      return createIdentifier(token.image);
    }

    functionCall(ctx: any): IExpression {
      const nameToken: IToken = ctx.Identifier[0];
      const args: IExpression[] = ctx.argumentList
        ? this.visit(ctx.argumentList)
        : [];
      return createFunctionCall(nameToken.image, args);
    }

    argumentList(ctx: any): IExpression[] {
      return ctx.arg.map((arg: any) => this.visit(arg));
    }

    argument(ctx: any): IExpression {
      if (ctx.namedArgument) return this.visit(ctx.namedArgument);
      return this.visit(ctx.expression);
    }

    namedArgument(ctx: any): IExpression {
      const nameToken: IToken = ctx.name[0];
      const valueExpr: IExpression = this.visit(ctx.value);
      return createNamedArgument(nameToken.image, valueExpr);
    }

    parenthesizedExpression(ctx: any): IExpression {
      return this.visit(ctx.expression);
    }
  }

  return new AstVisitor();
}
