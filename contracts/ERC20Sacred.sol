// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Sacred.sol";

contract ERC20Sacred is Sacred {
  address public token;

  constructor(
    IVerifier _verifier,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    address _operator,
    address _token,
    uint256 _fee
  ) Sacred(_verifier, _denomination, _merkleTreeHeight, _operator, _fee) {
    token = _token;
  }

  function _processDeposit() internal override {
    require(msg.value == 0, "ETH value is supposed to be 0 for ERC20 instance");
    _safeErc20TransferFrom(msg.sender, address(this), denomination);
  }

  function _processWithdraw(address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) internal override{
    require(msg.value == _refund, "Incorrect refund amount received by the contract");

    uint256 operatorFee = denomination * fee / 10000;
    _safeErc20Transfer(_recipient, denomination - operatorFee - _fee);

    if (operatorFee > 0) {
      _safeErc20Transfer(operator, operatorFee);
    }

    if (_fee > 0) {
      _safeErc20Transfer(_relayer, _fee);
    }

    if (_refund > 0) {
      (bool success, ) = _recipient.call{value:_refund}("");
      if (!success) {
        // let's return _refund back to the relayer
        _relayer.transfer(_refund);
      }
    }
  }

  function _safeErc20TransferFrom(address _from, address _to, uint256 _amount) internal {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd /* transferFrom */, _from, _to, _amount));
    require(success, "not enough allowed tokens");

    // if contract returns some data lets make sure that is `true` according to standard
    if (data.length > 0) {
      require(data.length == 32, "data length should be either 0 or 32 bytes");
      success = abi.decode(data, (bool));
      require(success, "not enough allowed tokens. Token returns false.");
    }
  }

  function _safeErc20Transfer(address _to, uint256 _amount) internal {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb /* transfer */, _to, _amount));
    require(success, "not enough tokens");

    // if contract returns some data lets make sure that is `true` according to standard
    if (data.length > 0) {
      require(data.length == 32, "data length should be either 0 or 32 bytes");
      success = abi.decode(data, (bool));
      require(success, "not enough tokens. Token returns false.");
    }
  }
}
