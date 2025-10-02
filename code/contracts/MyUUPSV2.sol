// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract MyUUPSV2 is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable {
    // v1 状态变量（保持不变，确保存储布局兼容）
    uint256 public value;
    
    // v2 新增状态变量（只能追加到末尾）
    string public name;
    uint256 public counter;

    // V2 新增初始化函数（用于升级后初始化新变量）
    function initializeV2(string memory _name) public reinitializer(2) {
        name = _name;
        counter = 0;
    }

    function setValue(uint256 _v) external onlyOwner {
        value = _v;
    }

    // V2 新增功能：计数器
    function increment() external {
        counter++;
    }

    function decrement() external {
        require(counter > 0, "Counter cannot be negative");
        counter--;
    }

    // V2 新增功能：设置名称
    function setName(string memory _name) external onlyOwner {
        name = _name;
    }

    // V2 新增功能：获取版本信息
    function getVersion() external pure returns (string memory) {
        return "v2.0.0";
    }

    // 升级鉴权：只有 owner 可升级
    function _authorizeUpgrade(address) internal override onlyOwner {}
}