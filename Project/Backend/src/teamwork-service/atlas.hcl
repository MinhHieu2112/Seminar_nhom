data "external_schema" "prisma" {
  program = [
    "npx",
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script"
  ]
}

env "local" {
  src = data.external_schema.prisma.url
  dev = "docker://postgres/16/dev?search_path=public"
}
