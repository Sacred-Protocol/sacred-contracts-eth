require('dotenv').config()

module.exports = {
  deployments: {
    netId4: {
      eth: {
        instanceAddress: {
          0.1: "0x8e1657ffdf84Ef90c25E8dc465Fa23127f4185Ef",
          1: "0xf88BD8230A9e3Ad6cEE4A14B5B5D834084E80371",
          10: "0x0415F93a1b846EB4471681680f948b34BcEb9156",
          100: "0xC18b26cC6C19BcEBbfdC456029eE93181e933BfD"
        },
        symbol: 'ETH',
        decimals: 18
      }
    },
    netId42: {
      eth: {
        instanceAddress: {
          0.1: "0x8e1657ffdf84Ef90c25E8dc465Fa23127f4185Ef",
          1: "0xf88BD8230A9e3Ad6cEE4A14B5B5D834084E80371",
          10: "0x0415F93a1b846EB4471681680f948b34BcEb9156",
          100: "0xC18b26cC6C19BcEBbfdC456029eE93181e933BfD"
        },
        symbol: 'ETH',
        decimals: 18
      }
    },
    netId80001: {
      eth: {
        instanceAddress: {
          0.1: "0xaAa355c04bee5D0dAd9f774F30c0Fb49FEdF252e",
          1: "0x147A4B5a098d71E457030E2F0631a00e62680102",
          10: "0x13742E4Ed90B6ff8B73A763670ae6FAbb250767c",
          100: "0x6944D64CC1487a2715EE35aef617f8767DF0815e"
        },
        symbol: 'ETH',
        decimals: 18
      }
    }
  }
}
