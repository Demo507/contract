// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract TCH8 is ERC20Pausable {
    error OnlyMinterError();
    error OnlyGovernanceError();
    error OnlyPendingGovernanceError();
    error ZeroAddressError();
    error InsufficientBalanceError();
    error MaxSupplyExceededError();

    uint256 public immutable maxSupply;

    address public governance;
    address public pendingGovernance;

    mapping(address => bool) public isMinter;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event GovernanceTransferStarted(address indexed previousGovernance, address indexed pendingGovernance);
    event GovernanceTransferAccepted(address indexed previousGovernance, address indexed newGovernance);

    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert OnlyMinterError();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernanceError();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _governance,
        uint256 _maxSupply
    ) ERC20(_name, _symbol) {
        if (_governance == address(0)) revert ZeroAddressError();
        governance = _governance;
        maxSupply = _maxSupply;
    }

    function addMinter(address minter) external onlyGovernance {
        if (minter == address(0)) revert ZeroAddressError();
        isMinter[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyGovernance {
        isMinter[minter] = false;
        emit MinterRemoved(minter);
    }

    function setGovernance(address newGovernance) external onlyGovernance {
        if (newGovernance == address(0)) revert ZeroAddressError();
        pendingGovernance = newGovernance;
        emit GovernanceTransferStarted(governance, newGovernance);
    }

    function acceptGovernance() external {
        if (msg.sender != pendingGovernance) revert OnlyPendingGovernanceError();
        emit GovernanceTransferAccepted(governance, pendingGovernance);
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }

    function pause() external onlyGovernance {
        _pause();
    }

    function unpause() external onlyGovernance {
        _unpause();
    }

    function mint(address recipient, uint256 amount) external onlyMinter {
        if (recipient == address(0)) revert ZeroAddressError();
        if (totalSupply() + amount > maxSupply) revert MaxSupplyExceededError();
        _mint(recipient, amount);
    }

    function burn(uint256 amount) external onlyMinter {
        if (balanceOf(msg.sender) < amount) revert InsufficientBalanceError();
        _burn(msg.sender, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function _update(address from, address to, uint256 value) internal override( ERC20Pausable) {
        super._update(from, to, value);
    }
}// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract TCH8 is ERC20Pausable {
    error OnlyMinterError();
    error OnlyGovernanceError();
    error OnlyPendingGovernanceError();
    error ZeroAddressError();
    error InsufficientBalanceError();
    error MaxSupplyExceededError();

    uint256 public immutable maxSupply;

    address public governance;
    address public pendingGovernance;

    mapping(address => bool) public isMinter;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event GovernanceTransferStarted(address indexed previousGovernance, address indexed pendingGovernance);
    event GovernanceTransferAccepted(address indexed previousGovernance, address indexed newGovernance);

    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert OnlyMinterError();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernanceError();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _governance,
        uint256 _maxSupply
    ) ERC20(_name, _symbol) {
        if (_governance == address(0)) revert ZeroAddressError();
        governance = _governance;
        maxSupply = _maxSupply;
    }

    function addMinter(address minter) external onlyGovernance {
        if (minter == address(0)) revert ZeroAddressError();
        isMinter[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyGovernance {
        isMinter[minter] = false;
        emit MinterRemoved(minter);
    }

    function setGovernance(address newGovernance) external onlyGovernance {
        if (newGovernance == address(0)) revert ZeroAddressError();
        pendingGovernance = newGovernance;
        emit GovernanceTransferStarted(governance, newGovernance);
    }

    function acceptGovernance() external {
        if (msg.sender != pendingGovernance) revert OnlyPendingGovernanceError();
        emit GovernanceTransferAccepted(governance, pendingGovernance);
        governance = pendingGovernance;
        pendingGovernance = address(0);
    }

    function pause() external onlyGovernance {
        _pause();
    }

    function unpause() external onlyGovernance {
        _unpause();
    }

    function mint(address recipient, uint256 amount) external onlyMinter {
        if (recipient == address(0)) revert ZeroAddressError();
        if (totalSupply() + amount > maxSupply) revert MaxSupplyExceededError();
        _mint(recipient, amount);
    }

    function burn(uint256 amount) external onlyMinter {
        if (balanceOf(msg.sender) < amount) revert InsufficientBalanceError();
        _burn(msg.sender, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function _update(address from, address to, uint256 value) internal override( ERC20Pausable) {
        super._update(from, to, value);
    }
}