pragma solidity 0.5.17;

import "./Sacred.sol";

interface IPool {
  function supply(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256);

}

contract ERC20Sacred is Sacred {
  address public token;
  address public lendingPoolAddressProvider;
  address public aToken;

  constructor(
    IVerifier _verifier,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    address _lendingPoolAddressProvider,
    address _token,
    address _aToken,
    address _operator,
    uint256 _fee
  ) Sacred(_verifier, _denomination, _merkleTreeHeight, _operator, _fee) public {
    token = _token;
    aToken = _aToken;
    lendingPoolAddressProvider = _lendingPoolAddressProvider;
  }

  function _processDeposit() internal {
    require(msg.value == 0, "ETH value is supposed to be 0 for ERC20 instance");
    address lendingPool = AddressesProvider(lendingPoolAddressProvider).getPool();
    IPool(lendingPool).supply(token, denomination, address(this), 0);
    collateralAmount += denomination;
    collectAaveInterests();
  }

  function _processWithdraw(address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) internal {
    // sanity checks
    require(msg.value == _refund, "Incorrect refund amount received by the contract");

    address lendingPool = AddressesProvider(lendingPoolAddressProvider).getPool();
    IPool pool = IPool(lendingPool);
    uint256 operatorFee = denomination * fee / 10000;
    require(AToken(aToken).approve(lendingPool, denomination), "aToken approval failed");
    pool.withdraw(token, denomination - operatorFee - _fee, _recipient);

    if (operatorFee > 0) {
      pool.withdraw(token, operatorFee, operator);
    }

    if (_fee > 0) {
      pool.withdraw(token, _fee, _relayer);
    }
    collateralAmount -= denomination;
    collectAaveInterests();

    if (_refund > 0) {
      (bool success, ) = _recipient.call.value(_refund)("");
      if (!success) {
        // let's return _refund back to the relayer
        _relayer.transfer(_refund);
      }
    }
  }

  function collectAaveInterests() public {
    uint256 interests = AToken(aToken).balanceOf(address(this)) - collateralAmount;
    if(interests > 0 && aaveInterestsProxy != address(0)) {
      AToken(aToken).approve(aaveInterestsProxy, interests);
      AToken(aToken).transfer(aaveInterestsProxy, interests);
      totalAaveInterests += interests;
    }
  }

}
