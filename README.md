# 生日快乐

手势控制的 3D 粒子生日蛋糕。握拳聚成蛋糕，张开散成星尘。

线上地址：[https://maclalex.github.io/birthday/](https://maclalex.github.io/birthday/)

代码仓库：[https://github.com/maclAlex/birthday](https://github.com/maclAlex/birthday)

日期写的是 2026 年 10 月 16 日。配色是夜色、奶油和暖金，不是圣诞树。

## 手势

请允许前置摄像头。一只手对着镜头即可。

| 手势 | 效果 |
| --- | --- |
| 握拳 | 粒子聚成双层蛋糕，蛋糕上有蜡烛 |
| 握拳并移动 | 旋转蛋糕 |
| 张开手掌 | 粒子散成星尘 |
| 一根手指 | 切换颜色：生日暖金、奶油、莓果夜 |
| 两根手指 | 撒下金色花瓣 |
| 三根手指 | 放一轮烟花 |

## 手机

竖屏会把蛋糕拉远，避免被裁切。说明收成一行，底部可以滑动这些按钮：

聚成蛋糕、散成星尘、换颜色、撒花、烟花、背景音乐。

没有摄像头权限时，用这些按钮也能玩。手机上的手势识别会轻一些，画面也没那么吃性能。

## 音乐

右上角「背景音乐」会循环一段生日歌。浏览器要等你点一下才会出声。再点一次就是「关闭音乐」。手机底部那一排里也有同一个按钮。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端里的本地地址。构建：

```bash
npm run build
```

## 发布

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。站点根路径是 `/birthday/`。

## 项目结构

```
birthday/
├── components/GestureTree.tsx   # 粒子蛋糕、手势、手机按钮
├── App.tsx
├── index.tsx
├── index.html
├── vite.config.ts               # Pages 上的 base 按仓库名生成
└── .github/workflows/deploy.yml
```

## 技术

Three.js 负责粒子和光晕，MediaPipe Hands 负责手势，GSAP 负责聚合的过渡，React 和 Vite 负责页面。
