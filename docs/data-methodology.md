# 数据与模型方法

## 数据沿袭

输入均来自原合作课程项目 MUSA-5500-Final-Project，而非本次重新实时采集。

| 输入 | 处理 | 输出 |
|---|---|---|
| Historical SNAP Retailer Locator Data 2004–2024.csv | Philadelphia / PA，End Date 为空，坐标在市界内 | 1,658 条历史 SNAP 记录；剔除 2 条坐标无效或不在市界内的记录 |
| OSM POI cache，2025-11-26 | 保留有名称且 shop=food/grocery/supermarket 的 node/way | 149 条候选，其中 9 对与 SNAP 暂时关联 |
| tract_summary.geojson | 仅提取 tract ID 和几何，不使用人口社会属性 | 408 个 census tract AOI |
| OSM drive cache，2025-11-26 | 车辆访问标记、单行方向、连续节点连接 | 133,545 节点，26,183 路段 way |

合并结果 1,658 + 149 − 9 = 1,798 条 POI 记录，不能表述为 1,798 家已核实且唯一的门店。USDA blank End Date 只代表该历史文件没有结束日期，不能证明目前营业或参加 SNAP。OSM 未出现也不能证明不存在。

## POI 模型

每条记录包含稳定 source-based ID、name、point、address、ZIP、category、snap、sources/sourceIds、vintage、phone、website、hours、wheelchair、checkDate、matchStatus、geometryMethod、area、completeness。

- POI 节点使用源坐标；建筑 way 使用去重顶点的平均坐标。不是面积质心，也不是已核验入口。
- 类别是展示层映射；Large Grocery 和含 super 的类别被统一为 Supermarket。原始细分类不能从这个展示标签完整还原，应回查源文件。
- OSM 采集范围有限，未补全所有 bakery、convenience 等标签，因此来源之间的类别覆盖不可直接比较。
- 完整度 = name/address/category/phone/website/hours 非空字段数，范围 0–6。不是评分、质量概率或业务价值。
- 默认排序按当前距离模式；最完整信息排序优先完整度，距离为第二排序键。不包含评分、销量、个性化或竞价。

## 实体匹配

名称去掉非字母数字字符并转小写；地址另标准化常见 Street/Avenue/方向缩写。仅名称与地址均相等、距离 ≤120 m、SNAP 候选唯一时进行 provisional linkage。仍保留两侧源 ID。尚未人工验证，也没有精确率或召回率结论。

这会遗漏店号后缀、旧店名等真实重复，例如同一品牌在 SNAP 与 OSM 中的写法不同。没有为了漂亮的去重数字增加未经评估的模糊合并。

## AOI 归属

point-in-polygon 支持 Polygon / MultiPolygon 和内环；先做 bounding-box 过滤，再做精确几何判断。边界上的点可能受射线法与坐标精度影响，需人工复核。不把最近的区域强配给未命中记录。

区域数据展示所有来源记录的观察计数，不随左侧类别/SNAP 搜索筛选变化；“within X min”是在当前出发点下该区域内满足驱车预算的数量。地图区域色深是原始记录数，不按面积或人口归一化，不能用于断言食品荒漠或覆盖水平。

## 路由

使用历史驾车网络，逐路段计算球面距离，构建有向邻接表，Dijkstra 求单源最短距离。车辆权限优先级 motorcar → motor_vehicle → vehicle → access，排除 no/private。支持 oneway=yes/1/true、-1；环岛/高速在未指定方向时默认单向。

起终点各自匹配最近路网节点，连接距离各不得超过 150 m。连接线仅为直线估算，未验证道路入口或障碍。总距离 = 起点连接 + 路网最短路 + 终点连接；模型分钟 = 总公里数 ÷25×60 +5。列表向上取整展示分钟，筛选用未取整模型值。

不支持实时路况、转向限制、条件性禁行、停车可用性、坡度、轮椅通行或实际步行。无法找到合格连接或无有向路径时，无驱车估算。Nearby 使用球面直线距离，不显示步行分钟。

方向与访问语义参考：[OSM oneway](https://wiki.openstreetmap.org/wiki/Key:oneway)、[OSM access](https://wiki.openstreetmap.org/wiki/Key:access)。这不是完整实现上述标签体系；仅处理了本原型明确列出的子集。

## 数据更新与治理待办

正式更新需要重新拉取获授权的数据、保留快照和差异、复核来源变更、对关联记录执行回归测试，而不是简单替换页面日期。优先核验高曝光记录和人工 flagged 记录。当前本地纠错不构成审核后台，也不会改变源属性。
