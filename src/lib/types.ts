export interface Token {
  id: string;
  name: string;
  symbol: string;
  logoColor: string;
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  reserve0: number;
  reserve1: number;
  totalSupply: number; // For LP tokens
}

export type UserBalance = {
  [key: string]: number; // key is token symbol
};
