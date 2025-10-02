import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyUUPSV2Module = buildModule("MyUUPSV2Module", (m) => {
  // 获取代理合约地址参数
  const proxyAddress = m.getParameter("proxyAddress");

  // 部署新的V2实现合约
  const implementationV2 = m.contract("MyUUPSV2");

  // 获取代理合约的MyUUPSV1接口（用于升级）
  const proxyAsV1 = m.contractAt("MyUUPSV1", proxyAddress);

  // 执行升级到V2
  m.call(proxyAsV1, "upgradeToAndCall", [
    implementationV2,
    "0x" // 空的调用数据，稍后单独调用initializeV2
  ]);

  // 获取升级后的代理合约的V2接口
  const proxyAsV2 = m.contractAt("MyUUPSV2", proxyAddress);

  // 初始化V2的新功能
  m.call(proxyAsV2, "initializeV2", ["UUPS Demo Contract"]);

  return { 
    implementationV2, 
    proxyAsV2 
  };
});

export default MyUUPSV2Module;