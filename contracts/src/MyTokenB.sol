// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.7.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyTokenB is ERC20, ERC20Permit {
    uint256 public constant FAUCET_AMOUNT = 1 ether;
    uint256 public constant FAUCET_COOLDOWN = 1 days;

    mapping(address => uint256) public faucetClaim;

    address public immutable faucetOwner;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(address recipient) ERC20("MyTokenB", "MTKB") ERC20Permit("MyTokenB") {
        faucetOwner = recipient;
        _mint(recipient, 1000000 * 10 ** decimals());
    }

    function faucet(address recipient) external {
        require(recipient != address(0), "Invalid recipient");

        require(
                    block.timestamp >= faucetClaim[recipient] + FAUCET_COOLDOWN,
                    "Faucet: wait 24 hours"
                );

        faucetClaim[recipient] = block.timestamp;

        _transfer(faucetOwner, recipient, FAUCET_AMOUNT);

         emit FaucetClaimed(recipient, FAUCET_AMOUNT);
    }
}