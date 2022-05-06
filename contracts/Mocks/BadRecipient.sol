// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

contract BadRecipient {
  fallback() external {
    require(false, "this contract does not accept ETH");
  }
}
