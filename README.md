# Fieldfare · Accessible Food Discovery

**A food shopping discovery prototype for Philadelphia.** Fieldfare helps someone start with a location and a travel budget, find possible stores, understand what is known about each place, and choose a next step.

## Background

In the [Philadelphia Food Desert Analysis](https://github.com/wenshaoting6-ui/MUSA-5500-Final-Project), Tim Wen and Lingxuan Gao studied how food access varies across the city. That work brought together retailer locations, road data, and neighborhood geography. It also raised a more immediate product question: **when someone needs to shop for food, which places can they realistically consider from where they are?**

## Why I built Fieldfare

A regional map can show a pattern without helping someone plan a specific trip. A useful discovery experience needs to connect three decisions: *Which stores fit my travel constraint? What information can I trust? What should I do next?*

I scoped Fieldfare around that decision flow. The MVP favors clear source labels and explicit uncertainty over a store recommendation that looks more certain than the underlying data. It focuses on driving because the available network supports that mode; walking and transit remain important future work, especially for households without a car.

## What I built

| Part of the experience | MVP capability |
| --- | --- |
| Discover | Search by name, address, or ZIP; filter by store category, historical SNAP listing, and travel budget. |
| Assess the trip | Choose a starting point, view a route on a directed driving network, and compare an illustrative travel-time estimate. A separate Nearby mode shows straight-line distance. |
| Assess the place | Open a place detail with data sources, snapshot dates, available contact information, missing fields, and any unresolved source match. |
| Act | Save places locally, open external directions, or flag a record for local review. |
| Explore areas | See observed place counts across 408 census tracts and move between an area and its places. |

The demo snapshot contains **1,798 place records** assembled from historical USDA SNAP retailer data and OpenStreetMap food POIs, including **9 provisional cross-source matches**. These are records for discovery, not 1,798 independently verified operating stores. [Data and routing methodology](docs/data-methodology.md)

## How I validated the MVP

**The working prototype has been checked for technical behavior and core journeys. It has not yet been tested with target users.**

- **Automated checks:** 11 passing tests cover search and filter combinations, SNAP status handling, area assignment, one-way roads, shortest paths, unreachable destinations, and snapshot consistency. JavaScript syntax checks also pass.
- **Hands-on walkthroughs:** Browser checks covered the discovery → detail → save → area-insight flow in desktop and mobile layouts. For one repeatable scenario, University City + Supermarket + historical SNAP listing + a 15-minute modeled driving budget returned 34 candidate records. Empty states, route reset, local saving, and the distinction between driving and Nearby modes were also checked.
- **Next validation step:** The [research plan](docs/research-plan.md) proposes moderated tasks with 5–8 Philadelphia food shoppers. The key questions are whether people can select a feasible candidate and correctly understand that a historical SNAP listing is not a current guarantee and that modeled travel time is not a live ETA. No user-study or business-impact result is claimed yet.

See the [validation record](docs/validation.md) for the exact checks and their limits.

## Run locally

Python 3 and Node.js are sufficient; no API key, paid map account, or package installation is needed.

```sh
npm run dev
```

Open <http://127.0.0.1:4173>. A suggested walkthrough is **University City → Supermarket → SNAP listed → 15 min → place detail → Save → Area insights**.

To run the checks:

```sh
npm test
npm run check
```

## Data and project notes

- The SNAP label means a retailer appears in a historical source file; current participation and opening status have not been verified. Driving time is a distance-based model, not live navigation. Nearby is straight-line distance, not a walking route. Here, “accessible” refers to geographic access, not a wheelchair-accessibility certification.
- The prototype does not request GPS. Saved places and review flags stay in the browser. Optional study events are off by default and are not uploaded.
- The original spatial analysis was a collaboration by **Tim Wen and Lingxuan Gao**. [Source-project lineage](docs/source-project.md) explains which inputs informed this separate MVP. [Data attribution and reuse notes](data/README.md) cover USDA, CDC-derived geography, and OpenStreetMap contributors.
- For the product scope, decisions, and future priorities, see the [product brief](docs/product-brief.md).
