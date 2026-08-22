# dsh-hmm-wait — 思维链弹幕插件

> 当模型思维链（reasoning / thinking）里出现 **hmm**、**wait**、**let me** 等"犹豫词"时，
> 在 dsh Web GUI 上弹出**可配置的弹幕动画**：流动方向、速度、抖动提醒、颜色、区域等全部可调，
> 并集成 dsh 官方设置面板（开关 + 全部参数）。

![形态](docs/architecture.svg)（结构图见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)）

---

## 功能特性

- 🎯 **实时监听思维链**：通过 dsh 官方 `llm/stream` waterfall 事件拦截流式推理输出（`reasoning-delta`），
  触发词一出现立即弹幕，无需等整条消息完成。
- 💬 **弹幕动画**：四种流动方向（右→左 / 左→右 / 上→下 / 下→上）、可调速（px/s）、
  顶部/底部/全屏区域、多轨道防重叠。
- 📳 **抖动提醒**：弹幕出现瞬间附带可配置幅度的抖动动画，一眼注意到模型"卡壳"。
- ⚙️ **官方配置面板**：设置 → 插件 → 可配置，开箱即用；所有修改 **live 生效**，无需重启。
- 🔌 **无强版本依赖**：运行时只依赖公开契约（事件名 + chunk 形状），SDK 均以宽松 peer 范围声明，
  宿主 dsh 升级不影响本插件。
- 🧪 **测试弹幕**：面板一键发送模拟弹幕，端到端验证链路（不依赖真实思维链内容）。

## 快速开始（安装）

> 前置：dsh 已安装并启动（Web GUI 模式）。

```bash
# 1. 克隆仓库（或下载 GitHub Release 里的 dsh-hmm-wait-0.1.0.tgz）
git clone https://github.com/<your-name>/dsh-hmm-wait.git
cd dsh-hmm-wait

# 2. 构建（需要 node ≥ 20 与 npm）
npm install
npm run build

# 3. 装进 dsh 的 web profile（junction link，随 profile 重启自动装配）
dsh plugin --profile web add link:$(pwd)

# 4. 重启 dsh 或在设置页 → 插件 → 可配置 中找到 Hmm-Wait 卡片
```

> 从 Release 直接安装 tgz：`dsh plugin --profile web add ./dsh-hmm-wait-0.1.0.tgz`（file: 依赖）。
>
> 详细装配说明（bundle patch / dsh.client 声明 / 如何卸载）见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 使用

1. **页面快捷配置**：右下角 ⚙ 齿轮按钮 → 弹出迷你卡片（开关、方向、速度、字号、抖动、测试弹幕），全部 live 生效。
2. **完整配置**：**设置 → 插件 → 可配置**，找到 **Hmm-Wait 思维链弹幕** 卡片（常用项 + 折叠的"高级选项"）。
3. 开关：**已启用 / 已停用**（关闭后 host 完全停止监听，零开销）。
4. 点 **测试弹幕** 立即验证显示效果。
5. 正常使用：给模型发一条需要"想一想"的任务，思考链里出现 `hmm` / `wait` / `let me` 时弹幕飞过。

### 配置项一览

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| 开关 enabled | true | 总开关（host 监听 + 弹幕层） |
| 触发词 triggers | hmm, wait, let me | 逗号分隔，正则自动转义 |
| 匹配位置 match | sentence-start | 句子/段首（推荐）或任意位置 |
| 大小写敏感 caseSensitive | false | 对英文触发词有效 |
| 冷却 cooldownMs | 5000 | 同一触发词防重复弹幕 |
| 限流 maxPerSecond | 3 | 全局限流 |
| 方向 direction | right-to-left | 四种流动方向 |
| 速度 speed | 120 | px/s |
| 区域 zone | top | 顶部 / 底部 / 全屏 |
| 字号 fontSize | 18 | px |
| 颜色 color | #ffd866 | CSS 颜色 |
| 透明度 opacity | 0.92 | 0.05–1 |
| 抖动 shake / shakeIntensity | on / 4px | 出现时抖动提醒 |
| 同屏上限 maxOnScreen | 12 | 超出挤掉最旧 |
| 弹幕文本 showContext / maxContextChars | 所在句 / 80 | 或仅触发词 |

## 工作原理（30 秒版）

```
模型流式输出 (llm/stream)
        │
        ▼
host 插件 tap ── 扫描 reasoning-delta 文本 ── 命中 hmm/wait/let me
        │                                                 │
        │                                          检测器（句子边界/冷却/限流）
        ▼                                                 ▼
  SSE: /api/dsh-hmm-wait/events ◄─────── 广播 DanmakuEvent
        │
        ▼
浏览器弹幕层（shell.overlay）── 轨道分配 + Web Animations 飞行 + 抖动
```

- **事件源**：`llm/stream`（dsh-llm 官方 waterfall 事件），监听器是"观察者"：不改写、不吞 chunk，检测异常也不影响模型流。
- **配置**：host 注册 `dsh-hmm-wait` settings 命名空间；client 把快照镜像到页面，live 生效。
- **推送**：SSE（GET `/api/dsh-hmm-wait/events`），断线自动 3s 重连；另有一个 POST `/api/dsh-hmm-wait/test` 用于测试。

## 无强版本依赖

- `peerDependencies` 全部是宿主已有包（cordis / schemastery / dsh-settings / dsh-host-webserver / dsh-client-runtime / dsh-client-ui-slots / react），不打包、不锁定 dsh 版本。
- 运行时只依赖两个字符串契约：事件名 `llm/stream` 与 chunk 的 `reasoning-delta` 形状（均为 dsh-llm 公开流协议）。
- dsh 升级后，本插件无需重装；如宿主 API 变更导致契约失效，插件只"安静失效"（不拖垮会话），且设置面板与测试弹幕仍可用。

## 开发与扩展

完整开发文档：**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**（含目录结构、构建、发布、扩展指南：加触发词算法、改弹幕动效、加新事件源等）。

```bash
npm run typecheck   # 类型检查
npm test            # 检测器回归测试（16 用例）
npm run build       # 构建 lib/（host ESM + client CJS bundle）
npm pack            # 产出可分发 tgz
```

## 许可证

BSD-3-Clause
