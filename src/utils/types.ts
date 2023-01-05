export type IfThenElse<
  Condition extends boolean,
  Then,
  Else
> = Condition extends true ? Then : Else;

export type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false;
