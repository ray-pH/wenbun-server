FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# dev server by default; docker-compose overrides command anyway
CMD ["npm", "run", "start"]