// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAMMPair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function swapToken0ForToken1(
        uint256 amount0In,
        uint256 minAmountOut
    ) external returns (uint256 amount1Out);

    function swapToken1ForToken0(
        uint256 amount1In,
        uint256 minAmountOut
    ) external returns (uint256 amount0Out);

    function getAmountOut(
        uint256 amountIn,
        bool zeroForOne
    ) external view returns (uint256 amountOut);

    function addLiquidity(
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 liquidity);

    function removeLiquidity(
        uint256 liquidity
    ) external returns (uint256 remainingLP);
}

contract Router is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IAMMPair public immutable ammPair;

    constructor(address pairAddress) {
        require(pairAddress != address(0), "Invalid pair");

        ammPair = IAMMPair(pairAddress);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 deadline
    )
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        require(block.timestamp <= deadline, "Transaction expired");
        require(amountIn > 0, "Amount is zero");
        require(recipient != address(0), "Invalid recipient");
        require(tokenIn != tokenOut, "Same token");

        address token0Address = ammPair.token0();
        address token1Address = ammPair.token1();

        require(
            (tokenIn == token0Address && tokenOut == token1Address) ||
            (tokenIn == token1Address && tokenOut == token0Address),
            "Invalid token pair"
        );

        bool zeroForOne;

        if (tokenIn == token0Address) {
            zeroForOne = true;
        } else {
            zeroForOne = false;
        }

        IERC20(tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            amountIn
        );

        IERC20(tokenIn).safeIncreaseAllowance(
            address(ammPair),
            amountIn
        );

        if (zeroForOne) {
            amountOut = ammPair.swapToken0ForToken1(
                amountIn,
                amountOutMin
            );
        } else {
            amountOut = ammPair.swapToken1ForToken0(
                amountIn,
                amountOutMin
            );
        }

        IERC20(tokenOut).safeTransfer(
            recipient,
            amountOut
        );
    }

    function getAmountOut(
    uint256 amountIn,
    address tokenIn,
    address tokenOut
    )
        external
        view
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Amount is zero");
        require(tokenIn != tokenOut, "Same token");

        address token0Address = ammPair.token0();
        address token1Address = ammPair.token1();

        require(
            (tokenIn == token0Address && tokenOut == token1Address) ||
            (tokenIn == token1Address && tokenOut == token0Address),
            "Invalid token pair"
        );

        bool zeroForOne;

        if (tokenIn == token0Address) {
            zeroForOne = true;
        } else {
            zeroForOne = false;
        }

        amountOut = ammPair.getAmountOut(
            amountIn,
            zeroForOne
        );
    }

    //add liquidity
    function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountA,
    uint256 amountB,
    address recipient,
    uint256 deadline
    )
        external
        nonReentrant
        returns (uint256 liquidity)
    {
        require(block.timestamp <= deadline, "Transaction expired");
        require(amountA > 0 && amountB > 0, "Amount is zero");
        require(recipient != address(0), "Invalid recipient");
        require(tokenA != tokenB, "Same token");

        address token0Address = ammPair.token0();
        address token1Address = ammPair.token1();

        require(
            (tokenA == token0Address && tokenB == token1Address) ||
            (tokenA == token1Address && tokenB == token0Address),
            "Invalid token pair"
        );

        uint256 amount0;
        uint256 amount1;

        if (tokenA == token0Address) {
            amount0 = amountA;
            amount1 = amountB;
        } else {
            amount0 = amountB;
            amount1 = amountA;
        }

        // User -> Router
        IERC20(tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            amountA
        );

        IERC20(tokenB).safeTransferFrom(
            msg.sender,
            address(this),
            amountB
        );

        // Router -> Pair
        IERC20(token0Address).safeIncreaseAllowance(
            address(ammPair),
            amount0
        );

        IERC20(token1Address).safeIncreaseAllowance(
            address(ammPair),
            amount1
        );

        // Pair mints LP tokens to the Router.
        liquidity = ammPair.addLiquidity(amount0, amount1);

        // Router -> recipient: transfer LP tokens.
        IERC20(address(ammPair)).safeTransfer(
            recipient,
            liquidity
        );
    }

    // Remove liquidity
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address recipient,
        uint256 deadline
    )
        external
        nonReentrant
        returns (uint256 amountA, uint256 amountB)
    {
        require(block.timestamp <= deadline, "Transaction expired");
        require(liquidity > 0, "Liquidity is zero");
        require(recipient != address(0), "Invalid recipient");
        require(tokenA != tokenB, "Same token");

        address token0Address = ammPair.token0();
        address token1Address = ammPair.token1();

        require(
            (tokenA == token0Address && tokenB == token1Address) ||
            (tokenA == token1Address && tokenB == token0Address),
            "Invalid token pair"
        );

        // Transfer LP tokens from the user to the Router.
        IERC20(address(ammPair)).safeTransferFrom(
            msg.sender,
            address(this),
            liquidity
        );

        // Record balances before removing liquidity.
        uint256 token0BalanceBefore =
            IERC20(token0Address).balanceOf(address(this));
        uint256 token1BalanceBefore =
            IERC20(token1Address).balanceOf(address(this));

        // The Pair burns the Router's LP tokens and returns underlying tokens.
        ammPair.removeLiquidity(liquidity);

        // Calculate the tokens received.
        uint256 amount0 =
            IERC20(token0Address).balanceOf(address(this))
                - token0BalanceBefore;
        uint256 amount1 =
            IERC20(token1Address).balanceOf(address(this))
                - token1BalanceBefore;

        // Convert Pair token order to the user's token order.
        if (tokenA == token0Address) {
            amountA = amount0;
            amountB = amount1;
        } else {
            amountA = amount1;
            amountB = amount0;
        }

        // Enforce slippage limits.
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");

        // Transfer underlying tokens to the recipient.
        IERC20(tokenA).safeTransfer(recipient, amountA);
        IERC20(tokenB).safeTransfer(recipient, amountB);
    }

        
}