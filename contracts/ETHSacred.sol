pragma solidity 0.5.17;

import "./Sacred.sol";

interface AddressesProvider {
    function getLendingPool()
    external
    view
    returns (address);
}

interface WETHGateway {
    function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode)
    external
    payable;
    
    function withdrawETH(address lendingPool, uint256 amount, address to)
    external;
}

interface AToken {
  function balanceOf(address _user) external view returns (uint256);
  function approve(address spender, uint256 amount) external returns (bool);
}

contract ETHSacred is Sacred {

  address public lendingPoolAddressProvider;
  address public wETHGateway;
  address public wETHToken;

  constructor(
    IVerifier _verifier,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    address _lendingPoolAddressProvider,
    address _wETHGateway,
    address _wETHToken,
    address _operator
  ) Sacred(_verifier, _denomination, _merkleTreeHeight, _operator) public {
    lendingPoolAddressProvider = _lendingPoolAddressProvider;
    wETHGateway = _wETHGateway;
    wETHToken = _wETHToken;
  }

  function _processDeposit() internal {
    require(msg.value == denomination, "Please send `mixDenomination` ETH along with transaction");
    address lendingPool = AddressesProvider(lendingPoolAddressProvider).getLendingPool();
    WETHGateway(wETHGateway).depositETH.value(denomination)(lendingPool, address(this), 0);
  }

  function _processWithdraw(address payable _recipient, address payable _relayer, uint256 _fee, uint256 _refund) internal {
    // sanity checks
    require(msg.value == 0, "Message value is supposed to be zero for ETH instance");
    require(_refund == 0, "Refund value is supposed to be zero for ETH instance");

    address lendingPool = AddressesProvider(lendingPoolAddressProvider).getLendingPool();
    AToken(wETHToken).approve(wETHGateway, denomination);
    WETHGateway(wETHGateway).withdrawETH(lendingPool, denomination - _fee, _recipient);

    if (_fee > 0) {
      WETHGateway(wETHGateway).withdrawETH(lendingPool, _fee, _relayer);
    }
  }
}
