# 0004: Frontend Separation of Static Catalog, API Client, and View State

We decoupled the static wellness directories and network fetching out of the monolithic `Deprex.jsx` file into dedicated `catalog.js` and `api.js` modules. The UI was connected to the persistent backend chat history and clinical summary endpoints.

## Considered Options
- Keeping all catalogs, fetch helpers, and UI views in a single 140KB JSX monolith (rejected: zero locality, content changes risk breaking React component render loops).
- Extracting static data to pure JSON files (rejected: loses JavaScript object structure and helper methods).
- Dedicated `catalog.js` and `api.js` modules (accepted: clean separation of domain resources, network transport, and reactive UI state).
