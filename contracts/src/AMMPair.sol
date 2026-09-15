// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.7.0
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract AMMPair is ERC20  {
    using SafeERC20 for IERC20;

    address public token0;
    address public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    constructor(address _token0, address _token1) ERC20("AMM LP Token", "AMM-LP") {
        require(_token0 != address(0), "token0 is zero address");
        require(_token1 != address(0), "token1 is zero address");

        token0 = _token0;
        token1 = _token1;
    }

    function addLiquidity(
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 liquidity){
         IERC20(token0).safeTransferFrom(
            msg.sender,
            address(this),
            amount0
        );
        IERC20(token1).safeTransferFrom(
            msg.sender,
            address(this),
            amount1
        );

        reserve0 += amount0;
        reserve1 += amount1;

        liquidity = _sqrt(amount0 * amount1);

        _mint(msg.sender, liquidity);
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;

        uint256 z = (x + 1) / 2;
        uint256 y = x;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }

        return y;
    }

    function removeLiquidity(uint256 liquidity) external returns (uint256 remainingLP){
        require(liquidity > 0, "liquidity is zero");

        uint256 totalSupply = totalSupply();

        uint256 amount0 = liquidity * reserve0 / totalSupply;
        uint256 amount1 = liquidity * reserve1 / totalSupply;

        _burn(msg.sender, liquidity);

        reserve0 -= amount0;
        reserve1 -= amount1;

        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);

        remainingLP = balanceOf(msg.sender); 
    }

    function swapToken0ForToken1(uint256 amount0In) external returns (uint256 amount1Out)
    {
        require(amount0In > 0, "amount0In is zero");

        uint256 amount0InWithFee = amount0In * 997 / 1000;

        uint256 k = reserve0 * reserve1;

        uint256 newReserve0 = reserve0 + amount0InWithFee;
        uint256 newReserve1 = k / newReserve0;

        amount1Out = reserve1 - newReserve1;

        IERC20(token0).safeTransferFrom(
            msg.sender,
            address(this),
            amount0In
        );

        IERC20(token1).safeTransfer(
            msg.sender,
            amount1Out
        );

        reserve0 = reserve0 + amount0In;
        reserve1 = newReserve1;
    }
}