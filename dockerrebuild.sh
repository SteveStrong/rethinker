#!/bin/bash
# Delete all containers
docker rm -f $(docker ps -a -q)

# use this build command
docker build -f nodesite.dockerfile -t datalift/rethink.datalift .

# use this run command
docker run -d --name baramundi -p 4000:3000 -p 4040:8080 datalift/rethink.datalift

docker ps 

docker exec -it baramundi /bin/bash