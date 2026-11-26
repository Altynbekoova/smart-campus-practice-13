# Smart Campus Room Availability Checker

Software Engineering Practice #13 compares a React/TypeScript implementation with a low-code Node-RED workflow for Engineering Lab A.

- [Published Bolt demo](https://smart-campus-room-ch-j2xp.bolt.host/?view=practice12)
- [Node-RED flow export](Practice_13_Node_RED.json)

## Code-based version
Run `npm ci`, then `npm run dev`. Open `/?view=practice12`. Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` to verify the project.

## Low-code version
In Node-RED 5.0.10, import `Practice_13_Node_RED.json`, select Deploy and open `http://localhost:1880/campus`. The live form interprets time in Asia/Almaty. POST JSON containing `start`, `end` (minutes since midnight) and `blocked` to `/campus/test` to run a case against the fixed 10:00 clock.

Both versions use fictional daily bookings at 09:00–10:00 and 13:00–14:00. Both passed all eight shared acceptance checks. The final TypeScript suite passed 56 of 56 tests.
