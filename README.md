# 基因分离定律的实质及应用

当前版本：2026-11-14 AI 素材连续动画版。采用 AI 生成的植物、豌豆种子、细胞及染色体图集，视觉样式见 `src/art-v2.css`，原图与提示词见 `assets/`。连续动画修改见 `verification-motion.md`；此前素材验证见 `verification-v2.md`。旧版在 `archive/2026-11-12-v1/`。

一生儿《高中生物一本通》· 必修 2

- 本机预览 [127.0.0.1:8911](http://127.0.0.1:8911/)，由当前设备上的预览服务提供。
- 离线版为 `index.html`。它内嵌全部样式、插图和交互，可直接用浏览器打开。
- 本模型沿用选必二成品的深绿书名栏、暖纸色讲解区和分步教学布局。

## 课堂操作

1. **分离动画**：从已复制的一对同源染色体开始，点击图或「下一步」跟踪 A 和 a。第三步展示四个单倍体产物。第四步用杂交实验当前的亲本，分别从卵细胞与精子池抽取一个配子，结果计入模拟样本。同源染色体分离为 6 秒、姐妹染色单体分离为 7 秒、受精为 4.5 秒。图层连续移动；可暂停、用进度条回看、0.5 倍慢放或重播本段。重播同一次受精不重复增加子代；重新点击画面才进行新抽样。可跳转阶段或连续播放。
2. **杂交实验**：选择自交、测交或自选亲本。点击棋盘格看单个组合的概率。理论区显示基因型和表型概率，模拟区显示有限样本的频数和频率。改变亲本组合会清空该批样本。
3. **应用推理**：依次揭示测交鉴别、黄色子代中的杂合子比例、连续出现黄色子代的推理，可将题设带入实验。
4. **显示**：支持全屏。窄屏竖屏时可点「横屏阅读」。显示方式切换保留当前阶段。

## 教学范围

采用豌豆种子黄色 A 对绿色 a 完全显性的课堂设定，图中只绘制一对与该性状相关的同源染色体。以该基因座与着丝粒之间未发生交换为示意情形，省略配子体发育。概率模型假定正常分离、随机受精和各基因型受精卵等存活。理论比例的细节见实验页「比例成立的条件」。参考 [OpenStax Biology 2e · Laws of Inheritance](https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance) 和 [Characteristics and Traits](https://openstax.org/books/biology-2e/pages/12-2-characteristics-and-traits)。

## 源文件与重建

`src/template.html`、`src/style.css` 和 `src/app.js` 分别负责页面、插图样式与交互，`src/genetics.js` 计算棋盘和抽样。修改后在本目录运行 `python3 build.py`，生成可离线使用的 `index.html`。需要重开本机预览时，在本目录运行 `python3 serve.py`。概率检查运行 `node --test model.test.cjs`。

## 公开发布

公开网页：https://meiosis7.github.io/gene-segregation-interactive/

GitHub 仓库：https://github.com/Meiosis7/gene-segregation-interactive

发布副本位于项目根目录 publish/gene-segregation-interactive。在线入口与两张带内容指纹的图片已检查；Chrome 实际打开公开网页，确认画面、阶段切换与杂交入口。

动画计算在 `src/motion.js`，`node --test model.test.cjs motion.test.cjs` 检查概率、运动中间帧、终点、暂停和速度。`python3 build.py --web` 生成在线版（只在发布副本中执行）；默认构建仍为独立离线文件。
