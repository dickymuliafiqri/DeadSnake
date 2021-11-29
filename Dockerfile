# syntax=docker/dockerfile:1

# Get image and set env
FROM node:lts
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy all files on current dir to WORKDIR
COPY . .

# Install dependencies and build app
RUN npm install
RUN npm run build

# Let's be awesome!
CMD [ "npm", "start" ]