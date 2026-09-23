# Data snapshots and attribution

These JSON files are a historical, compact research snapshot, not a current store directory or navigation service. The inputs and transformation are documented in [`manifest.json`](manifest.json), [`build_data.py`](../scripts/build_data.py), and the [data methodology](../docs/data-methodology.md).

- OpenStreetMap contributors supplied POI and road data. Those data are available under the [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright). The OSM-derived portions of `places.json` and `roads.json` retain that attribution and license; redistribution and reuse must comply with ODbL.
- Historical SNAP retailer records came from the [USDA SNAP Retailer Locator](https://www.fns.usda.gov/snap/retailer-locator). A historical record does not verify current authorization or operation.
- Tract geometry in `areas.json` was extracted from the original course project's `tract_summary.geojson`. Its notebook identifies the upstream tract data as CDC PLACES GIS-friendly data; see the [CDC PLACES portal](https://www.cdc.gov/places/tools/data-portal.html). The exact source download version has not been independently verified here.
- `city.json` derives from the original project's `City_Limits.geojson`. Its original download source was not recorded in the Fieldfare build manifest.

No license for the original course project's code or report is granted by this repository. No license for Fieldfare code or documentation is implied by this data notice.
