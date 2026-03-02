import { sensorPaths } from "@docs/sensor";
import { measurementTypePaths } from "@docs/measurementType";
import { measurementPaths } from "@docs/measurement";
import { userPaths } from "@docs/user";
import { sessionPaths } from "@docs/session";

const paths = {
  paths: {
    ...sensorPaths,
    ...measurementTypePaths,
    ...measurementPaths,
    ...userPaths,
    ...sessionPaths,
  },
};

export { paths };
