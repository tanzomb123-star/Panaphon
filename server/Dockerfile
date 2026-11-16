# Render API + worker image. Build from the repo root:
#   docker build -f server/Dockerfile -t code-video-server .
#   docker run -p 8080:8080 -e FILE_SECRET=... -v $PWD/data:/app/server/data code-video-server
FROM node:22-bookworm-slim

# ffmpeg for encoding, Thai fonts for subtitles/titles (Loma = the font the golden tests use)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-thai-tlwg fonts-noto-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Playwright is installed globally (the engine does require('playwright')), with Chromium and its system libs
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright NODE_PATH=/usr/local/lib/node_modules
RUN npm i -g playwright@1.48.2 && npx playwright install --with-deps chromium

WORKDIR /app
COPY video-engine/package.json video-engine/package-lock.json video-engine/
RUN cd video-engine && npm ci --omit=dev
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci
COPY video-engine/engine video-engine/engine
COPY server/src server/src
COPY server/migrations server/migrations

WORKDIR /app/server
ENV PORT=8080 DATA_DIR=/app/server/data NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "src/main.cjs"]
