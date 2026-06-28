import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

assert.match(source, /function horizontalDistance\(a, b\)/, "horizontal pickup helper is missing");
assert.match(source, /horizontalDistance\(coin\.mesh\.position, state\.player\.object\.position\) < 1\.55/, "coin pickup must use horizontal distance");
assert.match(source, /horizontalDistance\(relic\.mesh\.position, state\.player\.object\.position\) < 1\.65/, "relic pickup must use horizontal distance");
assert.match(source, /horizontalDistance\(state\.player\.object\.position, state\.exit\) < 1\.65/, "exit trigger must use horizontal distance");
assert.match(source, /state\.sprinting/, "sprint hysteresis state is missing");
assert.match(source, /Math\.ceil\(distance \/ 0\.1\)/, "movement should use small collision steps");
assert.doesNotMatch(source, /coin\.mesh\.position\.distanceTo\(state\.player\.object\.position\)/, "coin pickup still uses 3D distance");

console.log("logic-check-ok");
