FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Start the application in development mode
CMD ["yarn", "start", "dev"]
