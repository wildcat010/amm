// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AMMPair} from "../src/AMMPair.sol";
import {MyTokenA} from "../src/MyTokenA.sol";
import {MyTokenB} from "../src/MyTokenB.sol";


contract AMMPairTest is Test {
    MyTokenA public tokenA;
    MyTokenB public tokenB;
    AMMPair public pair;

    address public alice;

    function setUp() public {
        alice = makeAddr("alice");

        tokenA = new MyTokenA(alice);
        tokenB = new MyTokenB(alice);

        pair = new AMMPair(
            address(tokenA),
            address(tokenB)
        );
    }

    function test_PairCreatedCorrectly() public {
        assertEq(pair.token0(), address(tokenA));
        assertEq(pair.token1(), address(tokenB));
    }

    function test_InitialReservesAreZero() public {
        assertEq(pair.reserve0(), 0);
        assertEq(pair.reserve1(), 0);
    }

    function test_RevertIfToken0IsZeroAddress() public {
        vm.expectRevert();
        new AMMPair(address(0), address(tokenB));
    }

    function test_AddLiquidityUpdatesReserves() public {
        uint256 amountA = 1000 ether;
        uint256 amountB = 2000 ether;

        vm.startPrank(alice);

        tokenA.approve(address(pair), amountA);
        tokenB.approve(address(pair), amountB);

        pair.addLiquidity(amountA, amountB);

        vm.stopPrank();

        assertEq(pair.reserve0(), amountA);
        assertEq(pair.reserve1(), amountB);

        assertEq(tokenA.balanceOf(address(pair)), amountA);
        assertEq(tokenB.balanceOf(address(pair)), amountB);
    }

    function test_AddLiquidityMintsLPTokens() public {
        uint256 amountA = 1000 ether;
        uint256 amountB = 2000 ether;

        vm.startPrank(alice);

        tokenA.approve(address(pair), amountA);
        tokenB.approve(address(pair), amountB);

        pair.addLiquidity(amountA, amountB);

        vm.stopPrank();

        assertGt(pair.balanceOf(alice), 0);
    }

}