# Use official Node.js LTS image
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Set environment variables
ENV NODE_ENV production
ENV PORT=8080
EXPOSE 8080


# Create logs directory
RUN mkdir -p logs

# Run the application
CMD ["node", "src/app.js"]