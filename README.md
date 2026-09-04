hopes-go-launch — MVP scaffolding

This commit contains the initial Node.js project architecture for the hopes-go-launch MVP.

Structure highlights:
- src/server.js: Express entry point
- src/routes/{customer,driver,owner}.js: route skeletons for each user type
- src/controllers: controller placeholders
- src/services: payment (Stripe) and realtime (Socket.IO) placeholders
- src/middlewares/auth.js: JWT auth stub
- db/schema.sql: recommended Postgres schema (Supabase-friendly)

Next: implement auth, DB migrations, Stripe integration, and realtime ordering flows.
