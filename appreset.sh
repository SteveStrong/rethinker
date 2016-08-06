#!/bin/bash
# Stop all containers

docker build -f dockerfile -t stevestrongbah/rethinker .

docker rm -f thinker

docker run -d -p 4000:3000 -p 4040:8080 --name thinker stevestrongbah/rethinker

# docker exec -it thinker /bin/bash
# docker logs thinker
