# TTS-Batch-Generator

自用的 TTS 批量生成工具，主要用于基于 API 与运行在 [AutoDL](https://www.autodl.com/) 上的 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 的推理界面进行直接交互，提高 TTS 的整体生成效率。

本工具理论上并不对 GPT-SoVITS 的运行位置进行限制，只要推理界面能提供可达的 `url` 即可。

## 依赖

- Node v18

## 文件结构

```
├── example/                      # 示例音频
│   ├── example_describe.yaml     # 示例音频信息描述
│   ├── ......
│   └── xxx.wav                   # 示例音频文件
├── input/                        # 输入文本
│   ├── ......
│   └── xxx.json                  # 输入文本描述
├── output/                       # 输出音频
│   ├── ......
│   └── xxx.wav                   # 输出音频文件
├── config.yaml                   # 项目整体配置
├── index.js                      # 项目主程序入口
```

## 相关配置文件的类型定义

### 输入文本描述

```ts
type InputTexts = Array<{
    id: string;
    text: string;
    emotion: string;
}>;
```

### 示例音频信息描述

```ts
type ExampleDescribe = Record<string, {
    audio_file: string;
    text: string;
}>;
```

> 对象的成员属性（key）对应 `emotion`，至少应包含 `default`。

## 如何使用

### 依赖安装

```bash
npm install
```

### 素材准备 & 配置修改

1. 将示例音频放在 **`example`** 文件夹，并修改 `example_describe.yaml` 中的配置。
2. 将输入文本的描述文件放入 **`input`** 文件夹中。
3. 根据需要修改 `config.yaml` 中的配置，主要保证 `url` 正确。

> `url` 需要在 AutoDL 启动推理界面的 WebUI 后获取。

### 启动工具

> 启动前请保证推理界面的 WebUI 处于运作状态，并手动选好相应的模型。

```bash
node index.js
```

## License

MIT