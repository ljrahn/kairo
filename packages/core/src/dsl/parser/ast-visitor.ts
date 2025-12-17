import type { IToken } from "chevrotain";
import { invariant } from "../../utils";
import {
  createBooleanLiteral,
  createDuration,
  createDurationLiteral,
  createNumberLiteral,
  createStringLiteral,
  createIdentifier,
  createBinaryExpression,
  createFunctionCall,
  createNamedArgument,
  createUnaryExpression,
  createAssignmentStatement,
  createExpressionStatement,
  createProgram,
  type IAstLocation,
  type IExpression,
  type IBinaryOperator,
  type IProgram,
  type IStatement,
} from "../../ast";

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

    program(ctx: any): IProgram {
      const statementNodes: any[] = ctx.statement ?? [];
      const statements: IStatement[] = statementNodes.map((node) =>
        this.visit(node)
      );

      let location: IAstLocation = {
        line: 1,
        column: 1,
        offset: 0,
        length: undefined,
      };

      if (statements.length > 0) {
        location = statements
          .map((stmt) => stmt.location)
          .reduce((loc, next) => mergeLocations(loc, next));
      }

      return createProgram(statements, location);
    }

    statement(ctx: any): IStatement {
      if (ctx.assignmentStatement) {
        return this.visit(ctx.assignmentStatement);
      }
      if (ctx.expressionStatement) {
        return this.visit(ctx.expressionStatement);
      }

      invariant(false, "Invalid statement CST shape", {
        ctxKeys: Object.keys(ctx ?? {}),
      });
    }

    assignmentStatement(ctx: any): IStatement {
      const nameToken: IToken = ctx.name[0];
      const expression: IExpression = this.visit(ctx.value);
      const nameLocation = this.tokenToLocation(nameToken);
      const location = mergeLocations(nameLocation, expression.location);
      return createAssignmentStatement(nameToken.image, expression, location);
    }

    expressionStatement(ctx: any): IStatement {
      const expression: IExpression = this.visit(ctx.expression);
      const location = expression.location;
      return createExpressionStatement(expression, location);
    }

    expression(ctx: any): IExpression {
      return this.visit(ctx.orExpression);
    }

    orExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any) => {
          const right = this.visit(rhsOperand);
          const location = mergeLocations(result.location, right.location);
          result = createBinaryExpression("or", result, right, location);
        });
      }
      return result;
    }

    andExpression(ctx: any): IExpression {
      let result = this.visit(ctx.lhs);
      if (ctx.rhs) {
        ctx.rhs.forEach((rhsOperand: any) => {
          const right = this.visit(rhsOperand);
          const location = mergeLocations(result.location, right.location);
          result = createBinaryExpression("and", result, right, location);
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

        const right = this.visit(ctx.rhs[0]);
        const location = mergeLocations(result.location, right.location);
        result = createBinaryExpression(operator, result, right, location);
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
          const right = this.visit(rhsOperand);
          const location = mergeLocations(result.location, right.location);
          result = createBinaryExpression(operator, result, right, location);
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
          const right = this.visit(rhsOperand);
          const location = mergeLocations(result.location, right.location);
          result = createBinaryExpression(operator, result, right, location);
        });
      }
      return result;
    }

    unaryExpression(ctx: any): IExpression {
      if (ctx.Bang) {
        const token: IToken = ctx.Bang[0];
        const operand = this.visit(ctx.bangOperand[0]);
        const operatorLocation = this.tokenToLocation(token);
        const location = mergeLocations(operatorLocation, operand.location);
        return createUnaryExpression("!", operand, location);
      }
      if (ctx.Minus) {
        const token: IToken = ctx.Minus[0];
        const operand = this.visit(ctx.minusOperand[0]);
        const operatorLocation = this.tokenToLocation(token);
        const location = mergeLocations(operatorLocation, operand.location);
        return createUnaryExpression("-", operand, location);
      }
      if (ctx.primary) {
        return this.visit(ctx.primary[0]);
      }

      invariant(false, "Invalid unaryExpression CST shape", {
        ctxKeys: Object.keys(ctx ?? {}),
      });
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
        const location = this.tokenToLocation(token);
        return createNumberLiteral(parseFloat(token.image), location);
      }
      if (ctx.BooleanLiteral) {
        const token: IToken = ctx.BooleanLiteral[0];
        const location = this.tokenToLocation(token);
        return createBooleanLiteral(token.image === "true", location);
      }
      if (ctx.StringLiteral) {
        const token: IToken = ctx.StringLiteral[0];
        const location = this.tokenToLocation(token);
        return createStringLiteral(JSON.parse(token.image), location);
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
        const location = this.tokenToLocation(token);
        return createDurationLiteral(createDuration(value, unit), location);
      }

      invariant(false, "Invalid literal CST shape", {
        ctxKeys: Object.keys(ctx ?? {}),
      });
    }

    identifier(ctx: any): IExpression {
      const token: IToken = ctx.Identifier[0];
      const location = this.tokenToLocation(token);
      return createIdentifier(token.image, location);
    }

    functionCall(ctx: any): IExpression {
      const nameToken: IToken = ctx.Identifier[0];
      const args: IExpression[] = ctx.argumentList
        ? this.visit(ctx.argumentList)
        : [];
      const rParenTokens = ctx.RParen as IToken[] | undefined;
      const endToken: IToken =
        rParenTokens && rParenTokens.length > 0
          ? rParenTokens[rParenTokens.length - 1]!
          : nameToken;
      const location = this.tokensToLocation([nameToken, endToken]);
      return createFunctionCall(nameToken.image, args, location);
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
      const location = this.tokenToLocation(nameToken);
      return createNamedArgument(nameToken.image, valueExpr, location);
    }

    parenthesizedExpression(ctx: any): IExpression {
      return this.visit(ctx.expression);
    }

    tokenToLocation(token: IToken): IAstLocation {
      const startOffset = token.startOffset ?? 0;
      const endOffset = (token.endOffset ?? startOffset) + 1;

      return {
        line: token.startLine ?? 1,
        column: token.startColumn ?? 1,
        offset: startOffset,
        length: endOffset - startOffset,
      };
    }

    tokensToLocation(tokens: IToken[]): IAstLocation {
      const first = tokens[0]!;
      const last = tokens[tokens.length - 1] ?? first;
      const startOffset = first.startOffset ?? 0;
      const endOffset = (last.endOffset ?? startOffset) + 1;

      return {
        line: first.startLine ?? 1,
        column: first.startColumn ?? 1,
        offset: startOffset,
        length: endOffset - startOffset,
      };
    }
  }

  return new AstVisitor();
}

function mergeLocations(a: IAstLocation, b: IAstLocation): IAstLocation {
  const start = a.offset <= b.offset ? a : b;

  const aEndOffset = a.length != null ? a.offset + a.length : a.offset;
  const bEndOffset = b.length != null ? b.offset + b.length : b.offset;
  const endOffset = Math.max(aEndOffset, bEndOffset);

  return {
    line: start.line,
    column: start.column,
    offset: start.offset,
    length: endOffset - start.offset,
  };
}
