FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (ensure this matches PORT in .env, typically 3000)
EXPOSE 3000

# Start backend
CMD ["npm", "start"]
