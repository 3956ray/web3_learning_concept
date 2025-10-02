import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始UUPS可升级合约演示...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);

  // 1. 部署V1实现合约
  console.log("\n📦 部署V1实现合约...");
  const MyUUPSV1 = await ethers.getContractFactory("MyUUPSV1");
  const implementationV1 = await MyUUPSV1.deploy();
  await implementationV1.waitForDeployment();
  const implementationV1Address = await implementationV1.getAddress();
  console.log(`✅ V1实现合约地址: ${implementationV1Address}`);

  // 2. 部署代理合约
  console.log("\n📦 部署代理合约...");
  const SimpleProxy = await ethers.getContractFactory("SimpleProxy");
  
  // 编码初始化调用数据
  const initializeData = MyUUPSV1.interface.encodeFunctionData("initialize", [100]);
  
  const proxy = await SimpleProxy.deploy(implementationV1Address, initializeData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`✅ 代理合约地址: ${proxyAddress}`);

  // 3. 获取代理合约的V1接口
  const proxyV1 = MyUUPSV1.attach(proxyAddress);

  // 4. 测试V1功能
  console.log("\n🔍 测试V1功能:");
  const initialValue = await proxyV1.value();
  console.log(`   初始值: ${initialValue}`);
  
  await proxyV1.setValue(200);
  const newValue = await proxyV1.value();
  console.log(`   设置新值后: ${newValue}`);

  // 5. 部署V2实现合约
  console.log("\n📦 部署V2实现合约...");
  const MyUUPSV2 = await ethers.getContractFactory("MyUUPSV2");
  const implementationV2 = await MyUUPSV2.deploy();
  await implementationV2.waitForDeployment();
  const implementationV2Address = await implementationV2.getAddress();
  console.log(`✅ V2实现合约地址: ${implementationV2Address}`);

  // 6. 升级到V2
  console.log("\n⬆️  升级到V2...");
  await proxyV1.upgradeToAndCall(implementationV2Address, "0x");
  console.log("✅ 升级完成");

  // 7. 获取代理合约的V2接口
  const proxyV2 = MyUUPSV2.attach(proxyAddress);

  // 8. 初始化V2新功能
  console.log("\n🔧 初始化V2新功能...");
  await proxyV2.initializeV2("UUPS Demo Contract");
  console.log("✅ V2初始化完成");
  
  // 9. 验证升级后的状态
  console.log("\n🔍 验证升级后的状态:");
  const valueAfterUpgrade = await proxyV2.value();
  console.log(`   升级后的值 (应该保持不变): ${valueAfterUpgrade}`);
  
  const version = await proxyV2.getVersion();
  console.log(`   版本信息: ${version}`);
  
  const name = await proxyV2.name();
  console.log(`   合约名称: ${name}`);
  
  const counter = await proxyV2.counter();
  console.log(`   计数器初始值: ${counter}`);

  // 10. 测试V2新功能
  console.log("\n🆕 测试V2新功能:");
  
  // 测试计数器
  await proxyV2.increment();
  await proxyV2.increment();
  const counterAfterIncrement = await proxyV2.counter();
  console.log(`   增加计数器后: ${counterAfterIncrement}`);
  
  await proxyV2.decrement();
  const counterAfterDecrement = await proxyV2.counter();
  console.log(`   减少计数器后: ${counterAfterDecrement}`);
  
  // 测试设置名称
  await proxyV2.setName("升级成功的UUPS合约");
  const newName = await proxyV2.name();
  console.log(`   更新后的名称: ${newName}`);

  // 11. 验证V1功能仍然可用
  console.log("\n🔄 验证V1功能仍然可用:");
  await proxyV2.setValue(500);
  const finalValue = await proxyV2.value();
  console.log(`   最终值: ${finalValue}`);

  console.log("\n🎉 UUPS升级演示完成!");
  console.log(`📍 代理合约地址: ${proxyAddress}`);
  console.log(`📍 V1实现地址: ${implementationV1Address}`);
  console.log(`📍 V2实现地址: ${implementationV2Address}`);
  console.log("✨ 升级成功，所有状态都得到了保持，新功能正常工作!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 演示过程中出现错误:", error);
    process.exit(1);
  });