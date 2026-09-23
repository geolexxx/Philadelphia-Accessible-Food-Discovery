# 原课程项目与 Fieldfare 的关系

Fieldfare 从合作课程项目 **Philadelphia Food Desert Analysis**（Tim Wen 与 Lingxuan Gao）出发，将区域食品可达性分析转换为地点发现与到访决策原型。原项目代码与完整报告保留在[原项目仓库](https://github.com/wenshaoting6-ui/MUSA-5500-Final-Project)；本仓库不将其描述为 Fieldfare 的个人独立成果。

本仓库的 `data/*.json` 是从以下原项目文件构建的精简演示快照。路径相对于原项目根目录；输入哈希记录在 [`data/manifest.json`](../data/manifest.json)：

| 原项目输入 | Fieldfare 中的用途 |
| --- | --- |
| `data/Historical SNAP Retailer Locator Data 2004-2024.csv` | 提取费城历史 SNAP 地点，生成 `data/places.json` 的一部分 |
| `cache/8976cb2f48f2b54374b7812cd6bcf176107b84b0.json` | OSM 食品地点，生成 `data/places.json` 的一部分 |
| `cache/ab4772f896dc98eb098f3e8f495a48f695d9f5d9.json` | OSM 驾车网络，生成 `data/roads.json` |
| `outputs/tract_summary.geojson` | 仅提取 tract ID 与边界，生成 `data/areas.json`；不使用原项目的社会人口或风险评分 |
| `data/City_Limits.geojson` | 城市范围筛选与 `data/city.json` |

原项目笔记本 `Code.ipynb` 显示 tract 边界来自 CDC PLACES GIS-friendly tract 文件。`scripts/build_data.py` 可使用上述原项目文件重建 Fieldfare 快照；正常运行和演示直接使用仓库中的 JSON，无需下载原始输入。

原始 CSV、OSM 缓存、笔记本和旧报告未重复上传：它们体积较大，且旧报告中的部分模型表述与本原型不同。研究背景请查看原项目仓库；Fieldfare 当前口径以本仓库的[产品说明](product-brief.md)和[数据方法](data-methodology.md)为准。
