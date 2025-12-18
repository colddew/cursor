# Mac 上使用 Claude Code 通过MCP发布小红书笔记
快速指南：在 Mac 上安装小红书 MCP 工具，并集成到 Claude Code 中发布笔记

## 安装步骤

### 1. 下载工具

访问 GitHub 下载页面下载 Mac 版本：
https://github.com/xpzouying/xiaohongshu-MCP/releases

下载文件：`xiaohongshu-MCP-darwin-arm64`

### 2. 安装与配置

1. **启动服务（首次会弹窗提示）**
   ```bash
   ./xiaohongshu-MCP-darwin-arm64

2. **登录小红书**
   ```bash
   ./xiaohongshu-login-darwin-arm64
   ```
3. **安装 MCP Inspector**
   ```bash
   npx @modelcontextprotocol/inspector
   ```

4. **配置 MCP Inspector**
- Transport Type: Streamable HTTP
- URL: http://localhost:18060/mcp
- 点击「Connect」提示绿色表示连接成功
- 点击「List Tools」查看可用工具
- 点击「check_login_status」工具的「Run Tool」提示绿色表示登陆成功

## 配置 Claude Code 发布笔记

1. **添加 MCP 到 Claude Code**
   ```bash
   claude mcp add --transport http xhs-mcp http://localhost:18060/mcp
   ```
2. **验证安装**
   ```bash
   claude mcp list
   ```

3. **发布笔记**
- Claude Code 发送提示词“现在有哪些MCP工具”，查看可用的小红书工具
- Claude Code 发送提示词“使用小红书MCP帮我发布一个关于Nanobanana和沙雕程序员笔记”，生成小红书笔记
- 发布成功后会有提示，可以到小红书 App 查看笔记