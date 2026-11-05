import { readFileSync } from "fs";
import path from "path";

export type DemoUser = {
  email: string;
  password: string;
};

const userPath = path.resolve(process.cwd(), "mock-site/data/user.json");

export function loadDemoUser(): DemoUser {
  const parsed: unknown = JSON.parse(readFileSync(userPath, "utf8"));
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as DemoUser).email !== "string" ||
    typeof (parsed as DemoUser).password !== "string"
  ) {
    throw new Error("mock-site/data/user.json must include email and password");
  }
  return parsed as DemoUser;
}
