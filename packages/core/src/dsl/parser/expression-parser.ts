import { CstParser } from "chevrotain";
import {
  allTokens,
  NumberLiteral,
  BooleanLiteral,
  DurationLiteral,
  StringLiteral,
  Identifier,
  Assign,
  Plus,
  Minus,
  Multiply,
  Divide,
  GreaterThan,
  GreaterThanEqual,
  LessThan,
  LessThanEqual,
  Equal,
  And,
  Or,
  Not,
  LParen,
  RParen,
  Comma,
} from "../grammer";

export class ExpressionParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public expression = this.RULE("expression", () => {
    this.SUBRULE(this.orExpression);
  });

  private orExpression = this.RULE("orExpression", () => {
    this.SUBRULE(this.andExpression, { LABEL: "lhs" });
    this.MANY(() => {
      this.CONSUME(Or);
      this.SUBRULE2(this.andExpression, { LABEL: "rhs" });
    });
  });

  private andExpression = this.RULE("andExpression", () => {
    this.SUBRULE(this.comparisonExpression, { LABEL: "lhs" });
    this.MANY(() => {
      this.CONSUME(And);
      this.SUBRULE2(this.comparisonExpression, { LABEL: "rhs" });
    });
  });

  private comparisonExpression = this.RULE("comparisonExpression", () => {
    this.SUBRULE(this.additionExpression, { LABEL: "lhs" });
    this.OPTION(() => {
      this.OR([
        { ALT: () => this.CONSUME(GreaterThanEqual) },
        { ALT: () => this.CONSUME(LessThanEqual) },
        { ALT: () => this.CONSUME(GreaterThan) },
        { ALT: () => this.CONSUME(LessThan) },
        { ALT: () => this.CONSUME(Equal) },
      ]);
      this.SUBRULE2(this.additionExpression, { LABEL: "rhs" });
    });
  });

  private additionExpression = this.RULE("additionExpression", () => {
    this.SUBRULE(this.multiplicationExpression, { LABEL: "lhs" });
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Plus) },
        { ALT: () => this.CONSUME(Minus) },
      ]);
      this.SUBRULE2(this.multiplicationExpression, { LABEL: "rhs" });
    });
  });

  private multiplicationExpression = this.RULE(
    "multiplicationExpression",
    () => {
      this.SUBRULE(this.unaryExpression, { LABEL: "lhs" });
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(Multiply) },
          { ALT: () => this.CONSUME(Divide) },
        ]);
        this.SUBRULE2(this.unaryExpression, { LABEL: "rhs" });
      });
    }
  );

  private unaryExpression = this.RULE("unaryExpression", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Not);
          this.SUBRULE(this.unaryExpression);
        },
      },
      { ALT: () => this.SUBRULE(this.primaryExpression) },
    ]);
  });

  private primaryExpression = this.RULE("primaryExpression", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.literal) },
      { ALT: () => this.SUBRULE(this.functionCall) },
      { ALT: () => this.SUBRULE(this.identifier) },
      { ALT: () => this.SUBRULE(this.parenthesizedExpression) },
    ]);
  });

  private literal = this.RULE("literal", () => {
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(BooleanLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(DurationLiteral) },
    ]);
  });

  private identifier = this.RULE("identifier", () => {
    this.CONSUME(Identifier);
  });

  private functionCall = this.RULE("functionCall", () => {
    this.CONSUME(Identifier);
    this.CONSUME(LParen);
    this.OPTION(() => this.SUBRULE(this.argumentList));
    this.CONSUME(RParen);
  });

  private argumentList = this.RULE("argumentList", () => {
    this.SUBRULE(this.argument, { LABEL: "arg" });
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.argument, { LABEL: "arg" });
    });
  });

  private argument = this.RULE("argument", () => {
    this.OR([
      {
        GATE: this.BACKTRACK(this.namedArgument),
        ALT: () => this.SUBRULE(this.namedArgument),
      },
      { ALT: () => this.SUBRULE(this.expression) },
    ]);
  });

  private namedArgument = this.RULE("namedArgument", () => {
    this.CONSUME(Identifier, { LABEL: "name" });
    this.CONSUME(Assign);
    this.SUBRULE(this.expression, { LABEL: "value" });
  });

  private parenthesizedExpression = this.RULE("parenthesizedExpression", () => {
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
  });
}
