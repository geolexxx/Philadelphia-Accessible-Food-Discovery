# Accessible Food Discovery · Fieldfare

把 Philadelphia Food Desert Analysis 的空间分析素材升级为一个可操作的 POI 发现与到访决策原型。Fieldfare 是本次原型的展示名称，不代表已上线品牌或 TikTok 项目。

## 快速体验

在这个目录运行：

```sh
npm run dev
```

打开 http://127.0.0.1:4173。Python 3 提供静态服务；无需 npm install、API key 或地图收费账户。核心地图和数据在本地，字体为可选外部资源。不要直接双击 index.html，浏览器模块和 Worker 需要 HTTP。

推荐演示路径：University City → Supermarket → SNAP listed → 15 min → 打开地点详情 → 收藏 → Saved → Area insights。注意 SNAP 仅代表历史文件有记录；驱车时间是模型值，不是导航服务。

## 这次实际增加了什么

| 原项目素材 | 已实现的产品能力 | 对应 POI PM 能力 |
|---|---|---|
| SNAP / OSM 地点数据 | 1,798 条统一结构的 POI 记录，来源、年代、信息完整度、9 对待核验关联 | 数据供给、实体对齐、质量治理 |
| 驾车路网与距离分析 | 出发点选择、方向性最短路、预算筛选、选中路线、附近直线距离模式 | 可达性决策、模型边界、异常状态 |
| Census tract 边界 | 408 个区域的地点统计、区域筛选、地图联动 | POI–AOI 关联、区域供给观察 |
| 地图输出 | 可搜索列表、地点详情、收藏、外部导航入口、本地纠错标记 | 发现—决策—行动的完整流程 |
| 分析报告 | 产品问题、范围取舍、假设、埋点与用户研究方案 | 产品定义、优先级、验证设计 |

AOI 在这里指用于聚合的分析区域；census tract 不是商圈、服务区，也不是基于用户行为推导出的 AOI。

## 资料

- [产品说明与需求取舍](docs/product-brief.md)
- [数据、匹配与路由方法](docs/data-methodology.md)
- [用户研究与指标口径](docs/research-plan.md)
- [工程验证记录](docs/validation.md)
- [原课程项目与本仓库的数据沿袭](docs/source-project.md)

## 验证与重建

```sh
npm test
npm run check
python3 scripts/build_data.py --source '/path/to/MUSA-5500-Final-Project'
```

重建脚本仅使用 Python 标准库，读取原项目源文件，在本目录生成 data/*.json。当前快照附在项目内，因此正常演示不依赖原项目路径。输入文件 SHA-256 保存在 data/manifest.json；跨源关联清单见 data/match-review.json。

## 使用与事实边界

- 这是个人作品集研究原型，不是实时商业目录，不保证可营业、可通行或接受 SNAP。
- 只有驾车路网和直线距离，没有步行、公交、实时交通或无障碍路线。Accessible 在此表示空间可达性，并非无障碍认证。
- 没有商家核验、线上实验、实际到店、交易或留存结果；页面行为不能据此推导 GMV。
- 收藏和纠错仅存浏览器本地。可选事件记录默认关闭，只在当前标签页内存保留，可手动导出；不上传，不记录搜索词或坐标。清除浏览器站点数据会删除收藏与纠错。
- 导航按钮会在用户点击后将选定起终点传给 Google Maps；官网也是用户主动打开。项目不会自动请求 GPS。
- 本次升级独立存放，未改动原课程项目。原始 Philadelphia Food Desert Analysis 为 Tim Wen 与 Lingxuan Gao 的合作项目；不能把团队成果表述为个人独立完成。新增实现由本次 AI 辅助开发完成，申请材料应如实说明自己的定义、验证与决策工作。

## 数据授权

OSM 数据来自 OpenStreetMap contributors，受 ODbL 约束；[版权及数据库许可](https://www.openstreetmap.org/copyright)。USDA 来源为 [SNAP Retailer Locator](https://www.fns.usda.gov/snap/retailer-locator)。区域边界沿用原课程项目的 tract_summary.geojson；原项目笔记本显示其上游为 CDC PLACES GIS-friendly tract 数据，但本次尚未独立核对精确下载版本。详见[数据来源与使用说明](data/README.md)。原项目代码与报告的许可不由本升级重新授予。
