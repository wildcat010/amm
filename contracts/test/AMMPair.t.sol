// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AMMPair} from "../src/AMMPair.sol";
import {MyTokenA} from "../src/MyTokenA.sol";
import {MyTokenB} from "../src/MyTokenB.sol";

import {console} from "forge-std/console.sol";


contract AMMPairTest is Test {
    MyTokenA public tokenA;
    MyTokenB public tokenB;
    AMMPair public pair;

    address public alice;
    address public bob;

    function setUp() public {
        alice = makeAddr("alice");
        bob = makeAddr("bob");

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


     function test_SecondLiquidityProviderGetsProportionalLPTokens() public {
        uint256 aliceA = 1000 ether;
        uint256 aliceB = 2000 ether;

        uint256 bobA = 500 ether;
        uint256 bobB = 1000 ether;

        // Alice adds initial liquidity
        vm.startPrank(alice);

        tokenA.approve(address(pair), aliceA);
        tokenB.approve(address(pair), aliceB);

        pair.addLiquidity(aliceA, aliceB);

        uint256 aliceLP = pair.balanceOf(alice);

        // Give Bob the tokens he needs
        tokenA.transfer(bob, bobA);
        tokenB.transfer(bob, bobB);

        vm.stopPrank();

        // Bob adds proportional liquidity
        vm.startPrank(bob);

        tokenA.approve(address(pair), bobA);
        tokenB.approve(address(pair), bobB);

        pair.addLiquidity(bobA, bobB);

        vm.stopPrank();

        uint256 bobLP = pair.balanceOf(bob);

        assertEq(bobLP, aliceLP / 2);
    }

    function test_SecondLiquidityProviderGetsCorrectLPTokensWithExistingReserves() public 
    {
        uint256 aliceA = 1000 ether;
        uint256 aliceB = 2000 ether;

        uint256 bobA = 500 ether;
        uint256 bobB = 1000 ether;

        // Alice adds initial liquidity
        vm.startPrank(alice);

        tokenA.approve(address(pair), aliceA);
        tokenB.approve(address(pair), aliceB);

        pair.addLiquidity(aliceA, aliceB);

        vm.stopPrank();



        uint256 aliceTotalLP = pair.totalSupply();

        // Give Bob tokens
        vm.startPrank(alice);

        tokenA.transfer(bob, bobA);
        tokenB.transfer(bob, bobB);

        vm.stopPrank();

        // Bob adds liquidity
        vm.startPrank(bob);

        tokenA.approve(address(pair), bobA);
        tokenB.approve(address(pair), bobB);

        pair.addLiquidity(bobA, bobB);

        vm.stopPrank();

        uint256 bobLP = pair.balanceOf(bob);

        uint256 aliceLP = pair.balanceOf(alice);

        assertEq(aliceLP, aliceTotalLP );


        // Bob deposited 50% of both reserves,
        // so he should receive 50% of the existing LP supply which was alice LP token.
        assertEq(bobLP, aliceTotalLP / 2);
    }

    function test_RemoveLiquidityReturnsTokens() public 
    {
        uint256 amountA = 2000 ether;
        uint256 amountB = 4000 ether;

        // Alice adds liquidity
        vm.startPrank(alice);

        tokenA.approve(address(pair), amountA);
        tokenB.approve(address(pair), amountB);

        pair.addLiquidity(amountA, amountB);

        vm.stopPrank();

        uint256 aliceLP = pair.balanceOf(alice);

        // Alice half her liquidity
        vm.prank(alice);
        pair.removeLiquidity(aliceLP / 2);

        // Alice should have her tokens back
        assertApproxEqAbs(
            tokenA.balanceOf(alice),
            999_000 ether,
            1
        );

        assertApproxEqAbs(
            tokenB.balanceOf(alice),
            998_000 ether,
            1
        );

        // Pool should be empty
        assertApproxEqAbs(pair.reserve0(), 1000 ether, 1);
        assertApproxEqAbs(pair.reserve1(), 2000 ether, 1);

        assertApproxEqAbs(tokenA.balanceOf(address(pair)), 1000 ether, 1);
        assertApproxEqAbs(tokenB.balanceOf(address(pair)), 2000 ether, 1);

        // Alice should have no LP tokens left
        assertApproxEqAbs(pair.balanceOf(alice), aliceLP / 2, 1);
    }

    function test_RemoveLiquidityRevertsIfInsufficientLPTokens() public 
    {
        uint256 amountA = 1000 ether;
        uint256 amountB = 2000 ether;

        vm.startPrank(alice);

        tokenA.approve(address(pair), amountA);
        tokenB.approve(address(pair), amountB);

        pair.addLiquidity(amountA, amountB);

        vm.stopPrank();

        uint256 aliceLP = pair.balanceOf(alice);

        // Alice only owns aliceLP, so trying to remove more must fail
        vm.startPrank(alice);

        vm.expectRevert();

        pair.removeLiquidity(aliceLP + 1);

        vm.stopPrank();
    }

   
    function test_SwapToken0ForToken1() public 
    {
        uint256 liquidityA = 1000 ether;
        uint256 liquidityB = 2000 ether;
        uint256 swapAmount = 100 ether;

        // Alice provides liquidity
        vm.startPrank(alice);

        tokenA.approve(address(pair), liquidityA);
        tokenB.approve(address(pair), liquidityB);

        pair.addLiquidity(liquidityA, liquidityB);

        vm.stopPrank();

        // Alice approves the pair to take the token she wants to swap
        vm.prank(alice);
        tokenA.approve(address(pair), swapAmount);

        uint256 aliceBalanceBefore = tokenB.balanceOf(alice);

        // Swap A -> B, 0.3% fee
        vm.prank(alice);
        uint256 amount1Out = pair.swapToken0ForToken1(swapAmount);

        uint256 aliceBalanceAfter = tokenB.balanceOf(alice);

        // 0.3% fee
        uint256 amount0InWithFee = swapAmount * 997 / 1000;

        uint256 k = liquidityA * liquidityB;

        uint256 newReserve0ForPricing =
            liquidityA + amount0InWithFee;

        uint256 expectedReserve1 =
            k / newReserve0ForPricing;

        uint256 expectedAmount1Out =
            liquidityB - expectedReserve1;

        // Returned amount should match the expected amount
        assertEq(amount1Out, expectedAmount1Out);

        // Alice should have received exactly the expected amount of token B
        assertEq(
            aliceBalanceAfter - aliceBalanceBefore,
            expectedAmount1Out
        );

        // The pool receives the FULL 100 MTKA, including the fee
        assertEq(
            pair.reserve0(),
            liquidityA + swapAmount
        );

        // Pool should have less B
        assertLt(pair.reserve1(), liquidityB);
    }



}