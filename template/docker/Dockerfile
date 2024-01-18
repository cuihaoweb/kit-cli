# build stage
FROM node:18-alpine as build-stage
RUN node -v \
    && npm -v \
    && npm config set registry https://registry.npm.taobao.org/ \
    && npm config get registry
WORKDIR /app
COPY package*.json ./
COPY *-lock.json ./
RUN npm config get registry \
    && npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD [ "npm", "run", "start"]