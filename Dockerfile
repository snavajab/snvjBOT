FROM node:22-alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn --immutable
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]