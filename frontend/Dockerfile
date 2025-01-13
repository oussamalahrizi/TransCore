# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /app


# Copy package.json and package-lock.json
RUN mkdir -p /app/src

# Install dependencies
RUN npm init -y && \
npm install express

ENTRYPOINT [ "node", "src/server.js" ]
