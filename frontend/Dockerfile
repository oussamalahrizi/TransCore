# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /app


# Copy package.json and package-lock.json
RUN mkdir -p /app/src

COPY tools/init.sh /bin/init.sh

RUN chmod +x /bin/init.sh

# Install dependencies
RUN npm init -y && \
npm install express

ENTRYPOINT [ "/bin/init.sh" ]

CMD [ "node", "src/server.js"]
