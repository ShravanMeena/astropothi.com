# Pothi API.
#
# Two runtime dependencies that are easy to miss and fatal to omit:
#
#   1. poppler-utils — the preview service and the in-browser reader shell out to
#      `pdftoppm` and `pdftotext`. Without them every sample image and every
#      "Read it here" silently returns nothing.
#   2. The Devanagari fonts are vendored under engine/assets/fonts, so no system
#      font package is needed — but they must not be excluded from the image.
FROM node:24-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends poppler-utils ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first, so a code change does not reinstall node_modules.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Generated PDFs, preview images and reader pages live here. Mount a volume over
# it — on an ephemeral filesystem every past order loses its PDF on restart.
RUN mkdir -p out
VOLUME ["/app/out"]

ENV NODE_ENV=production
EXPOSE 4050

# No shell wrapper: node must be PID 1 so it receives SIGTERM and shuts down.
CMD ["node", "bin/www.js"]
