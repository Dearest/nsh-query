// The routes the activity fixtures (support/ActivityScenario.tsx) need: each answers after 100 ms.
export const activityNetwork = {
  "GET https://api.test/todos": { body: [], delay: 100 },
  "GET https://api.test/users": { body: [], delay: 100 },
  "POST https://api.test/todos": { status: 201, body: {}, delay: 100 },
  "PUT https://api.test/users/1": { body: {}, delay: 100 },
};
