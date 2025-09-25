FROM node:20-bullseye

# Install Chromium and runtime deps for puppeteer-core
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  chromium \
  fontconfig fonts-liberation fonts-noto fonts-noto-color-emoji \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 \
  libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 \
  && rm -rf /var/lib/apt/lists/*

# Environment: keep memory bounded, expose port, bypass any platform proxies during build & run
ENV GOOGLE_CHROME_BIN=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true \
    NODE_OPTIONS=--max-old-space-size=1024 \
    PORT=8080 \
    HTTP_PROXY= \
    HTTPS_PROXY= \
    ALL_PROXY= \
    NO_PROXY="*"

WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]


