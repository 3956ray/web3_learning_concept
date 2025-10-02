import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const MyUUPSV1Module = buildModule("MyUUPSV1Module", (m) => {
  // 部署实现合约
  const implementation = m.contract("MyUUPSV1");

  // 编码初始化调用数据
  const initializeData = m.encodeFunctionCall(implementation, "initialize", [100]);

  // 部署ERC1967Proxy代理合约，使用正确的合约名称
  const proxy = m.contract("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy", [
    implementation,
    initializeData
  ]);

  // 获取代理合约的MyUUPSV1接口
  const proxyAsMyUUPS = m.contractAt("MyUUPSV1", proxy);

  return { 
    implementation, 
    proxy, 
    proxyAsMyUUPS 
  };
});

export default MyUUPSV1Module;