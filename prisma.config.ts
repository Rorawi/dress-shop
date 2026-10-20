import { defineConfig } from "prisma/config";
import "dotenv/config"; // ensures .env is loaded

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});