FROM node:10 AS build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY rollup.config.js rollup.config.js
COPY static static
COPY src src
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Switch to final base image
FROM node:10.16.0-alpine
WORKDIR /usr/src/app

# Copy over deps and build files
COPY --from=build /usr/src/app/node_modules node_modules
COPY --from=build /usr/src/app/__sapper__ __sapper__
COPY --from=build /usr/src/app/static static

# Expose port 3000
ENV PORT 3000
EXPOSE $PORT

# Run, as non-root
USER node
CMD node __sapper__/build
