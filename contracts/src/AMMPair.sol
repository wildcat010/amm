// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.7.0
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract AMMPair is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public token0;
    address public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );

    event Swap(
        address indexed trader,
        bool zeroForOne,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _token0, address _token1) ERC20("AMM LP Token", "AMM-LP") {
        require(_token0 != address(0), "token0 is zero address");
        require(_token1 != address(0), "token1 is zero address");
        require(_token0 != _token1, "tokens must be different");

        token0 = _token0;
        token1 = _token1;
    }

    function addLiquidity(
        uint256 amount0,
        uint256 amount1
    ) external nonReentrant returns (uint256 liquidity){

        require(amount0 > 0, "amount0 is zero");
        require(amount1 > 0, "amount1 is zero");

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

        uint256 totalSupply = totalSupply();

        if (totalSupply == 0) {
            liquidity = _sqrt(amount0 * amount1);
        } else {
            uint256 liquidity0 = amount0 * totalSupply / reserve0;
            uint256 liquidity1 = amount1 * totalSupply / reserve1;

            liquidity = liquidity0 < liquidity1
                ? liquidity0
                : liquidity1;
        }

        require(liquidity > 0, "insufficient liquidity minted");

        reserve0 += amount0;
        reserve1 += amount1;

        _mint(msg.sender, liquidity);

        emit LiquidityAdded(
            msg.sender,
            amount0,
            amount1,
            liquidity
        );
    }

    function removeLiquidity(uint256 liquidity) external nonReentrant returns (uint256 remainingLP)
    {
        require(liquidity > 0, "liquidity is zero");
        require(totalSupply() > 0, "no liquidity");

        uint256 totalSupply = totalSupply();

        uint256 amount0 = liquidity * reserve0 / totalSupply;
        uint256 amount1 = liquidity * reserve1 / totalSupply;

        _burn(msg.sender, liquidity);

        reserve0 -= amount0;
        reserve1 -= amount1;

        IERC20(token0).safeTransfer(msg.sender, amount0);
        IERC20(token1).safeTransfer(msg.sender, amount1);

        emit LiquidityRemoved(
            msg.sender,
            amount0,
            amount1,
            liquidity
        );

        remainingLP = balanceOf(msg.sender); 
    }

     function swapToken0ForToken1(uint256 amount0In) external nonReentrant returns (uint256 amount1Out)
    {
        return _swap(amount0In, true, 0);
    }

    function swapToken1ForToken0(uint256 amount1In) external nonReentrant returns (uint256 amount0Out)
    {
        return _swap(amount1In, false, 0);
    }

    function swapToken0ForToken1(uint256 amount0In, uint256 minAmountOut) external nonReentrant returns (uint256 amount1Out)
    {
        return _swap(amount0In, true, minAmountOut);
    }

    function swapToken1ForToken0(uint256 amount1In, uint256 minAmountOut) external nonReentrant returns (uint256 amount0Out)
    {
        return _swap(amount1In, false, minAmountOut);
    }

    function getAmountOut(uint256 amountIn,bool zeroForOne) external view returns (uint256 amountOut) {
        require(amountIn > 0, "amountIn is zero");
        require(reserve0 > 0 && reserve1 > 0, "insufficient liquidity");

        // Calculate expected output using current reserves
        uint256 amountInWithFee = amountIn * 997 / 1000;
        uint256 k = reserve0 * reserve1;

        if (zeroForOne) {
            uint256 newReserve0 = reserve0 + amountInWithFee;
            uint256 newReserve1 = k / newReserve0;
            amountOut = reserve1 - newReserve1;
            
        } else {
            uint256 newReserve1 = reserve1 + amountInWithFee;
            uint256 newReserve0 = k / newReserve1;
            amountOut = reserve0 - newReserve0;
           
        }
        require(amountOut > 0, "insufficient output amount");
    }

    function getTokenBalances()
    external
    view
    returns (uint256 balance0, uint256 balance1)
    {
        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
    }

    function _swap(uint256 amountIn, bool zeroForOne, uint256 minAmountOut) internal returns (uint256 amountOut)
    {
        require(amountIn > 0, "amountIn is zero");
        require(reserve0 > 0 && reserve1 > 0, "insufficient liquidity");

        uint256 amountInWithFee = amountIn * 997 / 1000;
        uint256 k = reserve0 * reserve1;

        if (zeroForOne) {
            // token0 -> token1
            uint256 newReserve0 = reserve0 + amountInWithFee;
            uint256 newReserve1 = k / newReserve0;

            amountOut = reserve1 - newReserve1;

            require(amountOut >= minAmountOut, "slippage exceeded");

            IERC20(token0).safeTransferFrom(
            msg.sender,
            address(this),
            amountIn
            );

            IERC20(token1).safeTransfer(
            msg.sender,
            amountOut
            );

            reserve0 = reserve0 + amountIn;
            reserve1 = newReserve1;

        } else {
            // token1 -> token0
            uint256 newReserve1 = reserve1 + amountInWithFee;
            uint256 newReserve0 = k / newReserve1;

            amountOut = reserve0 - newReserve0;

            require(amountOut >= minAmountOut, "slippage exceeded");

            IERC20(token1).safeTransferFrom(
            msg.sender,
            address(this),
            amountIn
            );

            IERC20(token0).safeTransfer(
            msg.sender,
            amountOut
            );

            reserve0 = newReserve0;
            reserve1 = reserve1 + amountIn;
        }

        emit Swap(
            msg.sender,
            zeroForOne,
            amountIn,
            amountOut
        );
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
}