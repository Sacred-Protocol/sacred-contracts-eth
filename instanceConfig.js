require('dotenv').config()

module.exports = {
  eth: {
    amounts: ['0.1', '1', '10', '100'],
    token: {},
    aToken: {
      mainnet: '',
      kovan: '0xec6E5B3Bd3e8CC74756Af812994361d8D1EF30F8',
      rinkeby: '0x608D11E704baFb68CfEB154bF7Fd641120e33aD4',
      polygon: '0x685bF4eab23993E94b4CFb9383599c926B66cF57',
      mumbai: '',
    },
    symbol: 'ETH',
    decimals: 18
  },
  erc20: [
    {
      name: "dai",
      amounts: ['100', '1000', '10000', '100000'],
      token: {
        mainnet: '',
        kovan: '0x58Cd851c28dF05Edc7F018B533C0257DE57673f7',
        rinkeby: '0x4aAded56bd7c69861E8654719195fCA9C670EB45',
        polygon: '0x9A753f0F7886C9fbF63cF59D0D4423C5eFaCE95B',
        mumbai: '',
      },
      aToken: {
        mainnet: '',
        kovan: '0xE101EcB2283Acf0C91e05A428DDD8833Ac66B572',
        rinkeby: '0x49866611AA7Dc30130Ac6A0DF29217D16FD87bc0',
        polygon: '0xDD4f3Ee61466C4158D394d57f3D4C397E91fBc51',
        mumbai: '',
      },
      symbol: 'DAI',
      decimals: 18
    },
    {
      name: "usdc",
      amounts: ['100', '1000', '10000', '100000'],
      token: {
        mainnet: '',
        kovan: '0xa982Aef90A37675C0E321e3e2f3aDC959fB89351',
        rinkeby: '0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774',
        polygon: '0x9aa7fEc87CA69695Dd1f879567CcF49F3ba417E2',
        mumbai: '',
      },
      aToken: {
        mainnet: '',
        kovan: '0x36b5879749812B5f8d5Ed7a37ab465aEDBC5501f',
        rinkeby: '0x50b283C17b0Fc2a36c550A57B1a133459F4391B3',
        polygon: '0xCdc2854e97798AfDC74BC420BD5060e022D14607',
        mumbai: '',
      },
      symbol: 'USDC',
      decimals: 6
    },
    {
      name: "usdt",
      amounts: ['100', '1000', '10000', '100000'],
      token: {
        mainnet: '',
        kovan: '0x8D01d567AFdE8601C6BA784CF0da7Da12b3BFd66',
        rinkeby: '0x326005cFdF58bfB38650396836BEBF815F5ab4dD',
        polygon: '0x21C561e551638401b937b03fE5a0a0652B99B7DD',
        mumbai: '',
      },
      aToken: {
        mainnet: '',
        kovan: '0x27c838adB75F101886D2287a778bc35668E11d7b',
        rinkeby: '0x377D3F732CBeB84D0EebF71e1a4e3546Da86C76d',
        polygon: '0x6Ca4abE253bd510fCA862b5aBc51211C1E1E8925',
        mumbai: '',
      },
      symbol: 'USDT',
      decimals: 6
    },
  ],
}
