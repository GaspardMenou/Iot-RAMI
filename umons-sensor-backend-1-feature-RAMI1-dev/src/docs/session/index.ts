import { exportCsv } from "@docs/session/exportCsv";

const paths = {
  "/sessions/{id}/export/csv": {
    ...exportCsv,
  },
};

export { paths as sessionPaths };
