# Graph Report - Portifilio  (2026-06-19)

## Corpus Check
- 5 files · ~43,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 36 nodes · 50 edges · 8 communities (4 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0c14c81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `createListItemWrapper()` - 6 edges
2. `openModal()` - 6 edges
3. `populatePortfolio()` - 4 edges
4. `populateForms()` - 3 edges
5. `deleteListItem()` - 3 edges
6. `renderProjects()` - 3 edges
7. `renderListSection()` - 2 edges
8. `renderProjectItem()` - 2 edges
9. `renderEducationItem()` - 2 edges
10. `renderAchievementItem()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 4 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.33
Nodes (6): createListItemWrapper(), renderAchievementItem(), renderCertificationItem(), renderEducationItem(), renderExtraItem(), renderProjectItem()

### Community 2 - "Community 2"
Cohesion: 0.33
Nodes (6): openAchievementModal(), openCertificationModal(), openEducationModal(), openExtraModal(), openModal(), openProjectModal()

### Community 3 - "Community 3"
Cohesion: 0.48
Nodes (5): initScrollReveal(), populatePortfolio(), renderProjects(), setupProjectFilters(), showFallbackLoading()

### Community 4 - "Community 4"
Cohesion: 0.50
Nodes (4): deleteListItem(), populateForms(), renderListSection(), updateSyncStatus()

## Knowledge Gaps
- **3 isolated node(s):** `githubConfig`, `graphify`, `Workflow: graphify`
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createListItemWrapper()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `openModal()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `githubConfig`, `graphify`, `Workflow: graphify` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._