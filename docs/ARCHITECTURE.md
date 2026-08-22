# dsh-hmm-wait 开发文档（ARCHITECTURE）

本文档面向后续开发者：说明包结构、运行架构、装配方式、构建发布流程，以及常见的扩展点。
建议先读 `README.md` 的"工作原理（30 秒版）"。

---

## 1. 包结构

```
dsh-hmm-wait/
├── package.json            # dsh bundle 清单（dsh.bundle.patch / dsh.client）+ peer 声明
├── cordis.patch.yml        # bundle patch：向 profile roster 插入插件行（id: hmm-wait）
├── tsdown.config.ts        # 双产物构建：host ESM lib/index.js + client CJS lib/client.js
├── tsconfig.json           # 类型检查配置（strict）
├── tsconfig.build.json     # 声明文件产出（lib/types/）
├── scripts/build.sh        # 构建入口（bash，兼容 dsh 插件工具链）
├── src/
│   ├── index.ts            # ★ host 插件入口：settings 注册 + llm/stream tap + SSE hub + 路由
│   ├── schema.ts           # ★ 配置 schema（schemastery）+ 默认值 + 类型（host/client 共享）
│   ├── protocol.ts         # ★ SSE 协议与事件类型（host/client 共享）
│   ├── detect.ts           # ★ 流式触发检测器（纯函数，无依赖，可单测）
│   ├── routes.ts           # SSE hub + 订阅/测试路由（node:http）
│   └── client/
│       ├── index.ts        # ★ client 入口：slots 注册（overlay + 设置卡片）+ 配置镜像
│       ├── api.ts          # SSE 订阅（自动重连）+ 测试弹幕调用
│       ├── state.ts        # 模块级 store（弹幕队列 + 配置快照，useSyncExternalStore）
│       ├── danmaku.tsx     # 弹幕层（轨道分配 + Web Animations 飞行 + 抖动）
│       ├── panel.tsx       # 设置卡片（settings.plugin.item 槽位）
│       └── styles.ts       # 注入页面的 CSS（keyframes + 卡片样式）
└── docs/ARCHITECTURE.md    # 本文档
```

## 2. 运行架构

### 2.1 Host 侧（node 进程）

```
dsh host process
├── ctx.settings.register('dsh-hmm-wait', schema)   → SettingsScope（live 生效）
│      └── scope.watch(...)  → 更新 config；enabled=false 时卸掉 tap
├── ctx.on('llm/stream', tap)                        → 每路模型流一个 Detector
│      └── 扫描 reasoning-delta → 命中 → hub.broadcast(DanmakuEvent)
├── webServer.register(GET  /api/dsh-hmm-wait/events)  → SSE 订阅（挂起连接 + 30s 心跳）
└── webServer.register(POST /api/dsh-hmm-wait/test)    → 测试弹幕
```

- **llm/stream 语义**：dsh-llm 每次流式调用都会走 `ctx.waterfall(llm, 'llm/stream', options, next)`。
  监听器签名 `(options, next) => stream`。本插件是**观察者**：返回 `next()` 的包装流，
  逐 chunk `yield` 原样透传；检测逻辑全部包在 try/catch 中——任何异常都不会破坏模型流。
- **chunk 形状**（dsh-llm 公开协议）：`{ type: 'reasoning-delta', index, text }`。
  只做鸭子类型判断，不 import dsh-llm 运行时符号。
- **会话隔离**：每个 `llm/stream` 调用新建一个 detector（句子状态互不污染）。
- **事件 id**：进程级自增序号，client 端用于去重。

### 2.2 Client 侧（浏览器）

| 表面 | 槽位 | 说明 |
| --- | --- | --- |
| 弹幕层 | `shell.overlay`（list, root） | 全屏 fixed、pointer-events: none、点击穿透 |
| 设置卡片 | `settings.plugin.item`（keyed, root, key=`dsh-hmm-wait`） | 官方"设置 → 插件 → 可配置"页 |

- **配置镜像**：`ctx.settingsScope.bind({ namespace: 'dsh-hmm-wait' })` → `subscribe` →
  `publishConfigSnapshot()` 写进模块 store；两个组件通过 `useSyncExternalStore` 消费。
- **SSE 订阅**：`fetch + ReadableStream` 手动解析 SSE 帧（不用 EventSource，兼容性最好），断线 3s 重连。
- **动画**：Web Animations API（`element.animate`），飞行距离按方向与视口精确计算
  `duration = 距离 / speed × 1000`；抖动用注入的 CSS keyframes（幅度走 `--dsh-hmm-shake` 变量）。

### 2.3 装配（如何被 dsh 加载）

`cordis.patch.yml` 向 profile 的 cordis.yml 插入一行：

```yaml
- insert:
    - id: hmm-wait
      name: 'dsh-hmm-wait'
```

- **node half**：row 按包名解析 → `main: lib/index.js`（ESM）在 host 进程运行。
- **browser half**：`package.json` 的 `dsh.client` 声明让 loader 把 `exports['./client']`
  （`lib/client.js`，`window.__ModuleLoader__.load` 包裹）挂到 `/plugins/dsh-hmm-wait/client.js`，
  页面加载时注入浏览器插件树。
- **卸载**：`dsh plugin --profile web remove hmm-wait`（或注入器 `dev_uninject_plugin`），
  所有 fiber 清理（路由、tap、SSE 连接、DOM style、slot 条目）自动随 ctx.effect 拆除。

## 3. 构建与发布

```bash
npm install              # 安装 devDependencies（SDK 类型仅供编译期使用）
npm run build            # = tsc -p tsconfig.build.json（类型+d.ts） + tsdown（双 bundle）
npm pack                 # 产出 dsh-hmm-wait-0.1.0.tgz（files: lib/ + src/ + cordis.patch.yml）
```

- tsdown 的 node 产物把 `@deepseek-ai/*` 全部 external（运行时从宿主解析，绝不内联重复实例）；
  client 产物只把平台模块（react、cordis、slots 等）external，其余内联。
- **发布 GitHub Release**：`gh release create v0.1.0 dsh-hmm-wait-0.1.0.tgz`（附件即安装包）。

## 4. 扩展指南

### 4.1 加/改触发词算法（`src/detect.ts`）

- 每个 trigger 编译为 `(?:^|[^\p{L}\p{N}])(触发词)`，捕获组 1 为触发词本体；
- `sentence-start` 模式：命中点之前（自最近句子边界 `\n。！？!?；;` 起）只能有空白/引号；
- 冷却（每词）+ 全局限流（每秒滑动窗口）在 `RateLimiter` 内。
- 想加"同义词库/正则触发词"：把 `triggers` 语义改为正则片段即可（`escapeRegExp` 处放开）。

### 4.2 改弹幕动效（`src/client/danmaku.tsx` + `styles.ts`）

- 方向枚举在 `src/schema.ts`（`DanmakuDirection`），新方向只需在 `flight()` 加一个分支 + schema union 加一项；
- 轨道布局：`TRACKS_PER_ZONE` 与 `placement` useMemo；可改为"每轨道活跃计数"动态分配；
- 视觉参数全部进 `HmmWaitConfig` 并在面板加控件（panel.tsx 加一个 `<label>` 即可）。

### 4.3 加新事件源（例如"工具调用开始"也弹幕）

1. `src/index.ts` 里再加一个 `ctx.on(...)` tap，命中后走同一个 `hub.broadcast`；
2. 若需区分来源，给 `DanmakuEvent` 加 `kind` 字段（protocol.ts），client 端可选择性显示。

### 4.4 协议/接口稳定性承诺

- 对外 HTTP 路径：`/api/dsh-hmm-wait/events`、`/api/dsh-hmm-wait/test`（semver 内不变）；
- settings 命名空间：`dsh-hmm-wait`（字段增删走 schema 默认值，向后兼容）。

## 5. 故障排查

| 现象 | 排查 |
| --- | --- |
| 面板没有"Hmm-Wait 卡片" | host 未装配该行；检查 profile 插件列表、`cordis.patch.yml` 是否应用 |
| 弹幕不出现，但测试弹幕正常 | 当前模型流没有 reasoning-delta（如非推理模型），或触发词不在句首（改 `match: anywhere`） |
| 测试弹幕也不出现 | SSE 订阅失败：打开浏览器 Network 看 `/api/dsh-hmm-wait/events` 状态；`dsh plugin --profile web ls` 确认行存在 |
| 设置修改无效 | 确认 host 侧 `ctx.settings.register` 成功（重复注册会报错）；重启 dsh 后看设置文档 |
| 与 llm-retry 等插件共存 | tap 是观察者，多个监听器可叠加；重试会重新触发流，冷却机制兜底 |

## 6. 兼容性承诺

- 支持 dsh Web GUI（http://127.0.0.1:3080 形态）。
- Electron/file:// 形态下 fetch 走 client-connection 桥：普通请求可用，SSE 流式是否可用取决于桥实现
  （若不可用，功能静默降级——面板与配置仍正常）。
- 依赖的宿主 SDK 版本：`@deepseek-ai/*` 均以 `^0.1.0-rc.7` 宽松声明，宿主升级无需重装插件。
