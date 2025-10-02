import { expect } from "chai";
import { ethers } from "hardhat";

describe("UUPS Upgrade Test", function () {
  let proxyV1: any;
  let proxyV2: any;
  let proxyAddress: string;
  let owner: any;
  let implementationV1Address: string;
  let implementationV2Address: string;

  before(async function () {
    [owner] = await ethers.getSigners();
  });

  it("应该成功部署V1合约", async function () {
    // 部署V1实现合约
    const MyUUPSV1 = await ethers.getContractFactory("MyUUPSV1");
    const implementationV1 = await MyUUPSV1.deploy();
    await implementationV1.waitForDeployment();
    implementationV1Address = await implementationV1.getAddress();

    // 部署代理合约
    const SimpleProxy = await ethers.getContractFactory("SimpleProxy");
    const initializeData = MyUUPSV1.interface.encodeFunctionData("initialize", [100]);
    const proxy = await SimpleProxy.deploy(implementationV1Address, initializeData);
    await proxy.waitForDeployment();
    proxyAddress = await proxy.getAddress();

    // 获取代理合约的V1接口
    proxyV1 = MyUUPSV1.attach(proxyAddress);
    
    expect(proxyAddress).to.be.properAddress;
    expect(await proxyV1.value()).to.equal(100);
  });

  it("应该能够使用V1功能", async function () {
    await proxyV1.setValue(250);
    expect(await proxyV1.value()).to.equal(250);
  });

  it("应该成功升级到V2", async function () {
    // 部署V2实现合约
    const MyUUPSV2 = await ethers.getContractFactory("MyUUPSV2");
    const implementationV2 = await MyUUPSV2.deploy();
    await implementationV2.waitForDeployment();
    implementationV2Address = await implementationV2.getAddress();

    // 升级到V2
    await proxyV1.upgradeToAndCall(implementationV2Address, "0x");

    // 获取代理合约的V2接口
    proxyV2 = MyUUPSV2.attach(proxyAddress);

    // 初始化V2新功能
    await proxyV2.initializeV2("UUPS Demo Contract");
    
    // 验证升级后状态保持
    expect(await proxyV2.value()).to.equal(250);
    expect(await proxyV2.getVersion()).to.equal("v2.0.0");
    expect(await proxyV2.name()).to.equal("UUPS Demo Contract");
    expect(await proxyV2.counter()).to.equal(0);
  });

  it("应该能够使用V2的新功能", async function () {
    // 测试计数器功能
    await proxyV2.increment();
    expect(await proxyV2.counter()).to.equal(1);
    
    await proxyV2.increment();
    expect(await proxyV2.counter()).to.equal(2);
    
    await proxyV2.decrement();
    expect(await proxyV2.counter()).to.equal(1);
    
    // 测试设置名称功能
    await proxyV2.setName("测试合约");
    expect(await proxyV2.name()).to.equal("测试合约");
  });

  it("应该保持V1的原有功能", async function () {
    // V1的setValue功能应该仍然可用
    await proxyV2.setValue(500);
    expect(await proxyV2.value()).to.equal(500);
  });

  it("计数器不应该允许负数", async function () {
    // 重置计数器到0
    await proxyV2.decrement(); // 从1减到0
    
    // 尝试再次减少应该失败
    await expect(proxyV2.decrement()).to.be.revertedWith("Counter cannot be negative");
  });
});