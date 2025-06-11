FROM node:23.11.1

WORKDIR /
COPY package.json .
RUN npm config set fetch-retry-maxtimeout 6000000 && npm config set fetch-retry-mintimeout 1000000
RUN npm install
COPY . .
#CMD npm run makemigrations
#CMD npm run migrate
CMD npm run build && npm run start