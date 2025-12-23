根据 @docs/最终需求.md 帮我设计高保真的原型图

按照这个tailwind v4 的样式风格重新绘制下这个原型图的风格，执行命令：npx shadcn@latest add https://tweakcn.com/r/themes/violet-bloom.json ，ultrathink

/init 使用中文，ultrathink

@prototype/ 根据这个原型目录下的页面，开发出对应的IOS App页面，项目的工程代码是在 @voice-account/ 下，要求尽可能还原原型的样式
注意：
1. 可以参考 @docs/ 下的需求文档
2. @prototype/index.html 这个页面不需要还原，是一个概览页面
ultrathink（plan mode）

html使用python框架flask搭建后端服务，先帮我写一个health的接口，保证整个服务测试是完整的

在`app.py`中获取`.env`中的环境变量，并初始化supabase。`SUPABASE_URL`和`SUPABASE_SERVICE_ROLE_KEY`为supabase的Project URL和服务端私钥，使用服务端私钥初始化

现在开发用户录音的存储功能，具体要求如下：
1. 用户录音使用 supabase 的 Storage 功能，存储的 bucket 名称是：user-audios
2. 需要提供一个接口，接收前端 IOS App 传过来的录音文件，然后进行存储
ultrathink（plan mode）

我现在开发语音识别的接口，主要就是提供给记账 App 的后台接口功能，具体接口文档参考 @docs/api-bailian.md 
详细的要求如下：需要识别语音里的基本信息，包括：金额/标题/分类，以 json 的形式返回，接口中的请求参数是语音的 url 和分类信息，如果有多条需要返回多条

把服务端提供的接口以接口文件的方式写到 @docs 目录下，需要详细的请求字段和返回字段的示例，需要给到IOS App那边项目使用的，ultrathink

@docs/api-voice.md 根据接口文档，我们先调试第一个功能的接口，就是录音完后，通过“音频文件上传接口“上传录音，然后返回url，可以显示在界面上，ultrathink

xxx，这个是可以测试语音的url，测试阿里云语音识别的接口，ultrathink





@docs/api-accounting.md 根据 /audio/accounting 接口，调整现在的语音界面的交互逻辑，现在是调用上传语音的接口后，显示url，这个是用来调试的。实际使用时应该上传完语音后，就可以调用识别的接口，进行语音的识别动作，这里因为时间比较长，所以请做好用户交互的友好设计，ultrathink




