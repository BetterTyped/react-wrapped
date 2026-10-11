import { libConfig } from "../../tools/vite-lib";

export default libConfig({ dir: __dirname, entries: { index: "src/index.ts", internal: "src/internal/index.ts" } });
