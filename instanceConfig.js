require('dotenv').config()

module.exports = {
  eth: {
    amounts: ['0.1', '1', '10', '100'],
    token: {},
    aToken: {
      mainnet: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      kovan: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      rinkeby: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      polygon: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      mumbai: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
    },
    symbol: 'ETH',
    decimals: 18
  },
  erc20: [
    {
      name: "dai",
      amounts: ['100', '1000', '10000', '100000'],
      token: {
        mainnet: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        kovan: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        rinkeby: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        polygon: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        mumbai: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      },
      aToken: {
        mainnet: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        kovan: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        rinkeby: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        polygon: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        mumbai: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      },
      symbol: 'DAI',
      decimals: 18
    },
    {
      name: "usdt",
      amounts: ['100', '1000', '10000', '100000'],
      token: {
        mainnet: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        kovan: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        rinkeby: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        polygon: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        mumbai: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      },
      aToken: {
        mainnet: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        kovan: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        rinkeby: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        polygon: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
        mumbai: '0xb7eca5eAA51c678B97AE671df511bDdE2CE99896',
      },
      symbol: 'USDT',
      decimals: 18
    },
  ],
}
