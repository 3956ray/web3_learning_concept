# 是什么
它是一个合约库，作用是在开发过程中尽可能的最小化风险。
是一个经过市场验证的行业标准。
他是行业里的黄金审计标准，是业内对code审计的标准。包含了只能和与、ZKP、Infrastructure等多个维度
# Tokens
* [ERC-20](https://docs.openzeppelin.com/contracts/5.x/erc720): 同质化代币标准，用于发行、转账和管理可互换代币（如稳定币、治理币）。
		* 最小ERC20合约
```
contract ERC20FixedSupply is ERC20 {
    constructor() ERC20("Fixed", "FIX") {
        _mint(msg.sender, 1000);
    }
}-* 
```
* [ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721)：非同质化代币标准，每个代币唯一，用于 NFT（艺术品、门票、游戏道具）
- **与 ERC-20 区别**：ERC-20 代表可互换代币；ERC-721 **每枚独立、不可互换**，强调“所有权唯一标识”。    
- **标准结构**：比 ERC-20 更复杂，含多种**可选扩展**，接口拆分为多个合约。
- **OpenZeppelin 支持**：可自由组合基础实现与自定义扩展（如可枚举、元数据、可销毁、可暂停等），参考 API 选择模块。    
- **合约构建思路（游戏示例）**：用 ERC-721 追踪具有**独特属性**的道具；给玩家奖励时**动态铸造（mint）并转给其地址**；玩家可自由持有或交易。
- **铸造权限**：默认任何账户都能调用 `awardItem` 铸造；**应加入 AccessControl/Ownable** 等权限控制以限制可铸造账户（如仅管理员/后台服务）。
> 一句话定位：**ERC-721 = “唯一资产的链上所有权”标准，配合 OpenZeppelin 扩展即可快速、安全地实现可铸造、可转让、可管理的 NFT。**
```
// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract GameItem is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("GameItem", "ITM") {}

    function awardItem(address player, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(player, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }
}
```
* [ERC-1155](https://docs.openzeppelin.com/contracts/5.x/erc1155)：多资产代币标准，支持同时管理同质化和非同质化代币（适合游戏、收藏品）。
	* **多代币标准**：
		* 一个合约同时表示多种代币；`balanceOf(address, id)` 通过 **id** 区分不同代币的余额（对比 ERC-20/777 无 id）。  
	- **与 ERC-721 的区别**：
		- ERC-721 的 `balanceOf(address)` 统计“拥有多少个 NFT（种类数）”，每个 token id 只有存在/不存在；ERC-1155 为**每个 id 维护独立余额**，铸造数量为 1 即可表示“非同质化”。
	- **Gas 优势**：
		- 多代币场景下**无需为每种代币单独部署合约**，一个 ERC-1155 合约即可持有全部状态，显著降低部署与运维复杂度与成本。    
	- **批量操作**：
		- 因状态集中在单合约，可在一笔交易中高效处理多种代币：` balanceOfBatch` 批量查询余额；`safeBatchTransferFrom` 批量转账；常见扩展还包括 `_mintBatch` 等批量铸造。  
	- **合约构建思路（游戏道具示例）**：
		- 用 ERC-1155 追踪多种物品（各自属性不同），在构造函数中一次性铸造给部署者，之后再转给玩家；也可新增按需铸造的接口以便后续发放。
>一句话定位：**ERC-1155 = 一合约多资产 + 批量操作 + 低 Gas，多代币/道具/收藏品组合场景的首选标准。**
```
// contracts/GameItems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract GameItems is ERC1155 {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant THORS_HAMMER = 2;
    uint256 public constant SWORD = 3;
    uint256 public constant SHIELD = 4;

    constructor() ERC1155("https://game.example/api/item/{id}.json") {
        _mint(msg.sender, GOLD, 10 ** 18, "");
        _mint(msg.sender, SILVER, 10 ** 27, "");
        _mint(msg.sender, THORS_HAMMER, 1, "");
        _mint(msg.sender, SWORD, 10 ** 9, "");
        _mint(msg.sender, SHIELD, 10 ** 9, "");
    }
}



官方提供的示例：

# 查询余额
> gameItems.balanceOf(deployerAddress,3)
1000000000

# 划转到账户
> gameItems.safeTransferFrom(deployerAddress, playerAddress, 2, 1, "0x0")
> gameItems.balanceOf(playerAddress, 2)
1
> gameItems.balanceOf(deployerAddress, 2)
0

# 可以批量划转给多个用户，并批量的获取用户余额
> gameItems.safeBatchTransferFrom(deployerAddress, playerAddress, [0,1,3,4], [50,100,1,1], "0x0")
> gameItems.balanceOfBatch([playerAddress,playerAddress,playerAddress,playerAddress,playerAddress], [0,1,2,3,4])
[50,100,1,1,1]

# 获得数据的url
> gameItems.uri(2)
"https://game.example/api/item/{id}.json"

```
* [ERC-4626](https://docs.openzeppelin.com/contracts/5.x/erc4626)：金库代币标准，用于统一收益型金库（vault）的存取和收益分配接口。
	* 是ERC-20上定义的**金库统一接口**（deposit/mint/withdraw/redeem、convert/preview/max 等），让借贷市场、聚合器、利息型代币等资产协议**可组合**、可互操作。
	* 核心机制：用户存入 **assets（底层资产）**，获得 **shares（份额代币）**；shares 可销毁换回 assets；汇率由金库当前 **assets 与 shares 的比值**决定（例：100资产/200份额 → 1 share=0.5 asset；200/100 → 1 share=2 assets）。
	* 安全重点：通胀攻击-Inflation Attack
		* 攻击者先“捐赠”少量资产或操纵时序/四舍五入，使汇率异常，让后续存入者按不利汇率铸得更少 shares，或在赎回时受损。
		* 防范：
			* 存取前**使用`preview*` 报价并做最小/最大约束**（slippage check）；
			- 清晰的**舍入方向**（存入→向下取整，赎回→向上取整）并保持全局一致；
			- 谨慎处理**免铸/外部捐赠**对 `totalAssets` 的影响（必要时提供 `donate`/`skim` 路径并更新会计）；
			- 留意**可重入与钩子**（如 `before/after` 钩子里勿外调不受信合约；与 ERC777/回调交互时加 `nonReentrant`）；
			- 对接外部策略/预言机时，防 **价格操纵** 与 **流动性抽干**。
>**一句话定位**：**ERC-4626 = 统一的金库会计与存取接口，保证不同收益策略/协议之间的“即插即用”，前提是正确处理汇率、舍入与通胀攻击。**
* [ERC-6909](https://docs.openzeppelin.com/contracts/5.x/erc6909)：多代币账户抽象标准，在一个合约内支持无限数量的可转让资产（比 ERC-1155 更灵活）。
	* 借鉴ERC-1155 的**多代币标准草案**，目标是**进一步降 Gas、降复杂度**。
	* **核心变化（相对 ERC-1155）**：
		* **移除批量操作**（不再有 batch 查询/转账）；
		* **移除安全回调**（无 `onERC1155Received` 系列，减少外部调用与重入面）；
		* **更细粒度授权**：既支持**全局操作者**，也支持**按 Token 的额度型授权**（类似 ERC-20 的 `allowance` 思路）。
	* 一样是单合约承载多种资产（同质/拟同质/道具等），但以更轻量的接口实现以省 Gas。
	*  **元数据扩展**：基础实现**不含 `decimals`**；可引入 `ERC6909Metadata` 扩展为同质化条目添加小数位。
	* **安全/工程含义**：去掉回调与批量后，**调用路径更短**、**可组合性更直观**、**重入面更小**；但**一次多资产操作需自行聚合多笔交易**（前端/合约侧处理）。
>**一句话定位**：**ERC-6909 = “去批量、去回调、细粒度授权”的轻量多代币标准，用更少的 Gas 管更多资产，适合对成本与简洁度敏感的多资产场景。**
```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC6909Metadata} from "@openzeppelin/contracts/token/ERC6909/extensions/draft-ERC6909Metadata.sol";

contract ERC6909GameItems is ERC6909Metadata {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant THORS_HAMMER = 2;
    uint256 public constant SWORD = 3;
    uint256 public constant SHIELD = 4;

    constructor() {
        _setDecimals(GOLD, 18);
        _setDecimals(SILVER, 18);
        // Default decimals is 0
        _setDecimals(SWORD, 9);
        _setDecimals(SHIELD, 9);

        _mint(msg.sender, GOLD, 10 ** 18);
        _mint(msg.sender, SILVER, 10_000 ** 18);
        _mint(msg.sender, THORS_HAMMER, 1);
        _mint(msg.sender, SWORD, 10 ** 9);
        _mint(msg.sender, SHIELD, 10 ** 9);
    }
}

官方提供示例

# 查询余额
> gameItems.balanceOf(deployerAddress, 3)
1000000000

# 转账
> gameItems.transfer(playerAddress, 2, 1)
> gameItems.balanceOf(playerAddress, 2)
1
> gameItems.balanceOf(deployerAddress, 2)
0
```
# Access control
* Ownable：使用onlyOwner修饰函数，继承Ownable
	* `transferOwnership(newOwner)`：把所有权转给新账户；   
	* `renounceOwnership()`：放弃所有权（放弃后所有 `onlyOwner` 管理入口将**永久不可用**）。
	* **安全升级**：用 `Ownable2Step`（两步转移）降低误转风险——当前 owner 发起 `transferOwnership`，新 owner 必须 `acceptOwnership` 才生效。
	* **可组合性**：**合约也可做 owner**——把 owner 设为多签（如 Gnosis Safe）、DAO（如 Aragon）或自定义管控合约，可实现 2/3 多签、延时、投票等更复杂治理（如 MakerDAO 类做法）。
```
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function normalThing() public {
        // anyone can call this normalThing()
    }

    function specialThing() public onlyOwner {
        // only the owner can call specialThing()!
    }
}
```
> **一句话定位**：**Ownable = 简洁可靠的一人管理员模型；生产推荐用 Ownable2Step + 多签/DAO 作为所有者，安全与治理两手抓。**
* Access Control
```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AccessControlERC20Mint is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(address minter, address burner) ERC20("MyToken", "TKN") {
        _grantRole(MINTER_ROLE, minter);
        _grantRole(BURNER_ROLE, burner);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }
}
```
# 可升级合约
- **为什么用升级版合约包**：如果要用代理（Proxy）实现合约升级，需使用 **`@openzeppelin/contracts-upgradeable`**；它与主包同结构，但所有合约文件名都带 **`Upgradeable`** 后缀，并遵循“可升级合约写作规则”。
    
- **安装**
```
npm i @openzeppelin/contracts-upgradeable @openzeppelin/contracts
```
    
- **导入与替换**
```
-import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
+import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

-contract MyCollectible is ERC721 {
+contract MyCollectible is ERC721Upgradeable {
```

- **用初始化函数替代构造函数**：构造函数禁用，改用 `initialize()` + 内部父类初始化器
    
```


-    constructor() ERC721("MyCollectible", "MCO") public {
+    function initialize() initializer public {
  
	# 规则：状态变量在 `initialize` 中初始化；不得使用构造器逻辑。
	# `initializer`/`reinitializer` 守卫：防止重复初始化。
+        __ERC721_init("MyCollectible", "MCO");
     }
```

- **部署（Hardhat Upgrades Plugins）**
```
    const { ethers, upgrades } = require("hardhat");
    const MyCollectible = await ethers.getContractFactory("MyCollectible");
    const mc = await upgrades.deployProxy(MyCollectible); // 部署代理 + 逻辑合约
    await mc.waitForDeployment();
```
    
- **多重继承注意**    
    - 初始化器 **不会像构造器一样自动线性化**；每个 `__X_init` 内含父类调用。        
    - 同时调用多个 `__X_init` 可能造成**重复初始化**风险。        
    - 存在 `__X_init_unchained`（不调用父类），但**不建议手工拼装**，以免遗漏/重复。
        
- **命名空间存储（ERC-7201）**    
    - 升级版合约采用 **namespaced storage**（`@custom:storage-location erc7201:<NAMESPACE_ID>`）把各合约的存储分区管理。        
    - 作用：**可安全新增状态变量**、**改变继承顺序不影响布局**，避免传统线性存储里“变量下移/冲突”。
        
- **接口与库导入**    
    - **接口与库**不在 upgradeable 包内，仍从主包 `@openzeppelin/contracts` 导入。
        
- **安全与合规清单（上线必查）**(GPT总结版)    
    1. **无构造器逻辑**：全部迁移到 `initialize`；        
    2. 使用 **`initializer`/`reinitializer`** 防重复；        
    3. 升级前后**存储布局兼容**（若全用 namespaced storage 可大幅简化此风险）；        
    4. 慎用多重继承的 `__X_init` 组合，避免二次初始化；        
    5. 通过 **Upgrades 插件**进行部署与升级（自动做部分安全检查）；        
    6. 权限治理：把代理管理员放在 **多签/Timelock** 上，避免单点失误；        
    7. 升级流程：测试网演练 → 预检存储兼容 → 生产延时执行（Timelock）+ 事件公告。
        
 > **一句话定位**  **OpenZeppelin Upgradeable = 用 `Upgradeable` 合约 + 初始化器 + 命名空间存储 + 升级插件，安全地把合约从“一次性部署”升级为“可迭代演进”。**


