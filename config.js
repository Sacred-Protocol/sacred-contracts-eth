require('dotenv').config()

module.exports = {
  deployments: {
    netId1: {
      eth: {
        instanceAddress: {
          '0.1': undefined,
          '1': undefined,
          '10': undefined,
          '100': undefined
        },
        symbol: 'ETH',
        decimals: 18
      },
    },
    netId42: {
      eth: {
        instanceAddress: {
          '0.1': undefined,
          '1': undefined,
          '10': undefined,
          '100': undefined
        },
        symbol: 'ETH',
        decimals: 18
      },
      ceth: {
        instanceAddress: {
          '1': '0x6504342B28d20853f87BC3E2e63012c30AB8080C',
        },
        tokenAddress: '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72',
        symbol: 'cETH',
        decimals: 8
      },
    }
  }
}
