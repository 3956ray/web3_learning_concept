// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

contract MyUUPSV1 is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable {
    // v1 状态变量（升级时只能"追加"新变量到末尾）
    uint256 public value;

    function initialize(uint256 _value) public initializer {
        __Ownable2Step_init();
        __UUPSUpgradeable_init();
        value = _value;
        _transferOwnership(msg.sender); // 初始 owner：部署者（稍后移交 Timelock）
    }

    function setValue(uint256 _v) external onlyOwner {
        value = _v;
    }

    // 升级鉴权：后续把 owner 设为 Timelock，即只有 Timelock 可升级
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
