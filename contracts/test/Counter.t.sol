// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MyTokenA} from "../src/MyTokenA.sol";

import {MyTokenB} from "../src/MyTokenB.sol";


contract MyTokenATest is Test {
    MyTokenA public tokenA;
    address public recipient;

    function setUp() public {
        recipient = makeAddr("recipient");
        tokenA = new MyTokenA(recipient);
         assertEq(tokenA.name(), "MyTokenA");
         assertEq(tokenA.symbol(), "MTKA");
    }

    function test_Decimals() public {
        assertEq(tokenA.decimals(), 18);
    }

    function test_TotalSupply() public {
       assertEq(
        tokenA.totalSupply(),
        1_000_000 * 10 ** tokenA.decimals()
        );
    }

    function test_InitialBalance() public {
       assertEq(
        tokenA.balanceOf(recipient),
        1_000_000 * 10 ** tokenA.decimals()
        );
    }

    function test_ZeroAddressRecipient() public {
        vm.expectRevert();
        new MyTokenA(address(0));
    }
}

contract MyTokenBTest is Test {
    MyTokenB public tokenB;
     address public recipient;

    function setUp() public {
        recipient = makeAddr("recipient");
        tokenB = new MyTokenB(recipient);
         assertEq(tokenB.name(), "MyTokenB");
         assertEq(tokenB.symbol(), "MTKB");
    }

    function test_Decimals() public {
        assertEq(tokenB.decimals(), 18);
    }

    function test_TotalSupply() public {
       assertEq(
        tokenB.totalSupply(),
        1_000_000 * 10 ** tokenB.decimals()
        );
    }

    function test_InitialBalance() public {
       assertEq(
        tokenB.balanceOf(recipient),
        1_000_000 * 10 ** tokenB.decimals()
        );
    }

    function test_ZeroAddressRecipient() public {
        vm.expectRevert();
        new MyTokenB(address(0));
    }


}
