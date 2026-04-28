type EnvLike = Record<string, string | undefined>;

export function isKilled(env: EnvLike = process.env): boolean {
  return env.KILLSWITCH === "on";
}
