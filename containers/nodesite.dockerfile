FROM node:argon

# use this build command
#  docker build -f nodesite.dockerfile -t datalift/airports.datalift .

# use this run command
#  docker run -d -p 3000:3000 datalift/airports.datalift

#test server
# docker-machine ip

#push to hub
#  docker pull datalift/airports.datalift
#  docker push datalift/airports.datalift


ENV APP=/var/www

# Create app directory
RUN mkdir -p $APP
WORKDIR $APP

# Install app dependencies
COPY package.json $APP
RUN npm install --production

# Bundle app source
COPY . $APP

EXPOSE 3000
CMD [ "npm", "start", "--production" ]
