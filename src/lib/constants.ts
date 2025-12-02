import type { Token, Pool, UserBalance } from '@/lib/types';

export const TOKENS: Token[] = [
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', logoColor: '#2775ca' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', logoColor: '#26a17b' },
  { id: 'weth', name: 'Wrapped Ether', symbol: 'WETH', logoColor: '#716b94' },
  { id: 'zora', name: 'Zora', symbol: 'ZORA', logoColor: '#8F00FF' },
];

export const INITIAL_POOLS: Pool[] = [
  {
    id: 'weth-usdc',
    token0: TOKENS.find(t => t.symbol === 'WETH')!,
    token1: TOKENS.find(t => t.symbol === 'USDC')!,
    reserve0: 100, // 100 WETH
    reserve1: 400000, // 400,000 USDC
    totalSupply: 20000,
  },
  {
    id: 'zora-weth',
    token0: TOKENS.find(t => t.symbol === 'ZORA')!,
    token1: TOKENS.find(t => t.symbol === 'WETH')!,
    reserve0: 1000000, // 1,000,000 ZORA
    reserve1: 50, // 50 WETH
    totalSupply: 22360,
  },
];

export const INITIAL_USER_BALANCE: UserBalance = {
  USDC: 20000,
  USDT: 20000,
  WETH: 10,
  ZORA: 50000,
  'WETH-USDC-LP': 0,
  'ZORA-WETH-LP': 0,
};

export const SWAP_FEE = 0.003; // 0.3%
