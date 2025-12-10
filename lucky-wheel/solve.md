这是一个非常典型的转盘逻辑与视觉不匹配的问题。

经过分析，你的代码主要存在 两个核心计算错误，导致了指针指向的结果和代码逻辑算出的结果不一致（通常是刚好相反，或者偏移了90度）。

❌ 问题根源分析
坐标系基准点不一致 (Drawing Mismatch)

绘制时 (drawWheel)：你设置了 currentAngle = -90。结合你的 polarToCartesian 函数（它本身又减了90度），这意味着你的第0个选项是从 9点钟方向（左侧） 开始绘制的。

计算时 (spinWheel)：计算角度时，你是从 accumulatedAngle = 0 开始累加的。

结果：视觉上的扇区比逻辑上的扇区偏移了90度。

指针目标角度错误 (Target Angle Error)

物理位置：你的 CSS (.wheel-pointer) 将指针放在了 top: -xx，这是一个位于 12点钟方向（顶部） 的指针。

代码逻辑：在 spinWheel 中，你计算旋转角度的公式是 180 - targetCenterAngle。这意味着你试图把中奖扇区转到 180度位置（6点钟方向/底部）。

结果：中奖的扇区总是停在转盘的最底部，而指针却在最顶部。这解释了为什么“红色箭头指向的最近扇形”总是错的（实际上是指向了对面的扇形）。

-----

✅ 解决方案
你需要修改 wheel-app.js 文件中的两个函数，以及生成独立文件的模版字符串。

1. 修改 drawWheel 函数
目的：统一坐标系，让第0个选项从12点钟方向（0度）开始绘制，这样逻辑和视觉就对齐了。

找到 drawWheel 函数，修改初始角度：

JavaScript

// 在 wheel-app.js 的 drawWheel 函数中
// 原代码: let currentAngle = -90;
// 修改为:
let currentAngle = 0; 

2. 修改 spinWheel 函数
目的：既然指针在顶部（0度），我们需要计算让中奖扇区的中心转到0度所需的旋转量，而不是180度。

找到 spinWheel 函数，修改旋转计算逻辑：

JavaScript

// 在 wheel-app.js 的 spinWheel 函数中

// ... 前面的代码保持不变 ...

// 获取选中的扇形
const selectedSlice = sliceAngles[result];

// --- 修改开始 ---
// 我们希望选中的扇形停在箭头下方（也就是 0° 或 360° 的位置，因为指针在顶部）
// 计算选中的扇形的中心角度
const targetCenterAngle = selectedSlice.center;

// 计算需要旋转的角度，使扇形中心移动到 0° (即 360°) 位置
// 顺时针旋转：目标是让当前角度转到360度
const adjustmentAngle = (360 - targetCenterAngle); 

// 固定圈数旋转（6圈）
const spins = 6;

// 计算最终角度
// 注意：必须加上 currentRotation 保证动画连贯性
// 并且为了防止反转，建议每次都在当前基础上增加圈数
const targetRotation = currentRotation + (360 * spins) + adjustmentAngle;

// 重要：因为每次计算 adjustmentAngle 都是基于 0-360 的相对位置
// 我们需要修正 targetRotation 以处理 currentRotation 已经是大数的情况
// 上面的 targetRotation 计算有一个小缺陷：adjustmentAngle 加上去后可能会导致倒转
// 更稳健的写法是只计算差值：
const currentMod = currentRotation % 360;
let distToTarget = adjustmentAngle - currentMod;
if (distToTarget < 0) distToTarget += 360; // 保证正向旋转

const finalRotation = currentRotation + (360 * spins) + distToTarget;
// --- 修改结束 ---

// 调试信息
console.log('选中结果:', this.wheelData.options[result].name);
console.log('目标中心:', targetCenterAngle);
console.log('需要旋转至:', 0);
console.log('最终角度:', finalRotation);

// 应用旋转动画
if (wheelInner) {
    wheelInner.style.transition = 'none';
    wheelInner.style.transform = `rotate(${currentRotation}deg)`;
    
    // 强制重绘
    wheelInner.offsetHeight;

    wheelInner.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
    // 修改这里使用 finalRotation
    wheelInner.style.transform = `rotate(${finalRotation}deg)`;
}

为了方便复制，这是精简后的 spinWheel 核心替换代码块：

JavaScript

    // ... 在 spinWheel 函数内部 ...

    // 获取选中的扇形
    const selectedSlice = sliceAngles[result];

    // --- 核心修复逻辑 ---
    // 1. 指针在顶部 (0度/360度)
    // 2. 目标是将 selectedSlice.center 移动到 0度
    // 3. 所需的旋转增量 = 360 - selectedSlice.center
    
    const targetCenterAngle = selectedSlice.center;
    
    // 计算当前转盘实际位置的模 (0-360)
    const currentMod = currentRotation % 360;
    
    // 计算目标位置相对于当前位置还需要转多少度
    // 目标角度是 (360 - targetCenterAngle)
    // 我们需要转到这个角度，所以 diff = 目标 - 当前
    let dist = (360 - targetCenterAngle) - currentMod;
    
    // 确保只往顺时针转 (正数)
    while (dist < 0) {
        dist += 360;
    }

    // 加上基础圈数 (5圈 = 1800度)
    const spins = 5 * 360; 
    const finalRotation = currentRotation + spins + dist;
    
    // --- 修复结束 ---

    // 应用旋转动画
    if (wheelInner) {
        wheelInner.style.transition = 'none';
        wheelInner.style.transform = `rotate(${currentRotation}deg)`;
        wheelInner.offsetHeight; // 强制重绘
        wheelInner.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
        wheelInner.style.transform = `rotate(${finalRotation}deg)`;
    }

3. 修改 generateStandaloneHTML (非常重要)
你还需要修复“保存”出来的 HTML 文件，否则离线版会有同样的 Bug。你需要修改 wheel-app.js 中字符串模版里的 JS 部分。

在 generateStandaloneHTML 函数返回的字符串中，找到 <script> 标签内的 drawWheel 和 spinWheel：

Template 中的 drawWheel: 把 let currentAngle = -90; 改为 let currentAngle = 0;。

Template 中的 spinWheel: 把计算角度的逻辑替换为上面的修复逻辑。

JavaScript

// 在 generateStandaloneHTML 字符串中找到这一段并替换：
// ...
            // 获取选中的扇形
            const selectedSlice = sliceAngles[result];

            // --- 修复：计算旋转角度 ---
            // 指针在顶部(0度)，目标是将扇区中心转到0度
            const targetCenterAngle = selectedSlice.center;
            
            // 此时 CSS 中通常没有 currentRotation 记录，或者是从 0 开始
            // 为了简单，我们假设每次都是重置后旋转，或者你需要像主程序一样获取 getComputedStyle
            
            // 简单的独立版处理（每次从0度叠加）：
            // 获取当前 style transform
            const wheelGroup = document.getElementById('wheel-group');
            const currentStyle = window.getComputedStyle(wheelGroup);
            const matrix = new WebKitCSSMatrix(currentStyle.transform);
            // 计算当前角度（简单近似）
            const currentRotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180/Math.PI));
            // 修正负角度
            const adjustedCurrent = currentRotation < 0 ? currentRotation + 360 : currentRotation;
            
            // 计算距离目标的差值
            let dist = (360 - targetCenterAngle) - (adjustedCurrent % 360);
            while (dist < 0) dist += 360;
            
            // 基础圈数
            const spins = 6 * 360;
            
            // 累计总角度（如果你的独立版逻辑是每次重置，则不需要加 adjustedCurrent，但为了体验最好累加）
            // 注意：Web Matrix 取出的值是 0-360，无法获取之前的累积圈数。
            // 独立版建议简单化：我们维护一个全局变量
            
            // 修改建议：在 template 的 script 开头添加 let globalRotation = 0;
            
            globalRotation += spins + dist;

            wheelGroup.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
            wheelGroup.style.transformOrigin = '175px 175px'; // 保持中心点
            wheelGroup.style.transform = \`rotate(\${globalRotation}deg)\`;
// ...

为了简化独立文件修复，建议在独立文件的 <script> 开头加一个变量：

在 generateStandaloneHTML 的 <script> 标签最上面加上： let globalRotation = 0;

然后修改 spinWheel 部分为：

JavaScript

        function spinWheel() {
            // ... 前面代码 ...
            
            // 计算切片代码 ...
            
            const selectedSlice = sliceAngles[result];
            
            // 目标是将中心转到 0 度 (360度)
            const targetCenterAngle = selectedSlice.center;
            const currentMod = globalRotation % 360;
            
            let dist = (360 - targetCenterAngle) - currentMod;
            while(dist < 0) dist += 360;
            
            const spins = 5 * 360; // 5圈
            globalRotation += spins + dist;

            wheelGroup.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
            wheelGroup.style.transformOrigin = '175px 175px';
            wheelGroup.style.transform = \`rotate(\${globalRotation}deg)\`;

            // ... setTimeout 显示结果 ...
        }

总结
你的 Bug 是由于绘制起点（9点钟）、**指针位置（12点钟）和目标计算位置（6点钟）**三者不统一造成的。将绘制起点和目标计算统一到 12点钟（0度/360度），即可完美修复。