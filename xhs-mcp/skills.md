# 安装
register this repository as a Claude Code Plugin marketplace by running the following command in Claude Code:

/plugin marketplace add anthropics/skills

Then, to install a specific set of skills:

- Select Browse and install plugins
- Select anthropic-agent-skills
- Select document-skills or example-skills
- Select Install now

# 使用提示词
xxx 使用 ppt 的 skills 实现

# 创建skills
能够抽象成 skills 的点：功能稍微复杂，独立的小单元，功能不能汇聚太多，否则有难点

- 复刻 word 排版样式
- @xxx.docx 我的需求是需要将一些资料，生成的 Word 文档格式使用类似这个文档
- 我现在需要记录这些格式，然后使用另外一个主题，根据格式，填充内容
- 将上面的功能抽取为 skills（skill-creator）
- 使用 docx-format-replicator这个技能帮我写一份xxx的调研信息文档