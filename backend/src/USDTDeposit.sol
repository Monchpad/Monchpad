// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract USDTDeposit {
    IERC20 public usdt;
    uint256 public minDepositAmount;
    uint256 public startTimestamp;
    uint256 public endTimestamp;
    mapping(address => uint256) public deposits;
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(
        address _usdtAddress,
        uint256 _minDepositAmount,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        require(_endTimestamp > _startTimestamp, "End must be after start");
        usdt = IERC20(_usdtAddress);
        minDepositAmount = _minDepositAmount;
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
    }

    modifier isDepositOpen() {
        require(block.timestamp >= startTimestamp && block.timestamp <= endTimestamp, "Deposit period inactive");
        _;
    }

    function deposit(uint256 amount) external isDepositOpen {
        require(amount >= minDepositAmount, "Amount below minimum deposit");
        require(amount > 0, "Amount must be greater than 0");
        require(usdt.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        deposits[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        require(usdt.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance(address user) external view returns (uint256) {
        return deposits[user];
    }

    function getTotalBalance() external view returns (uint256) {
        return usdt.balanceOf(address(this));
    }
}