# redish

Save links to an RSS feed you can ignore from anywhere.

## Deployment

- The `docker-compose.yml` is designed for public facing deployments
- The `docker-compose.prod.yml` allows for connecting to an external Postgres container over a Docker network.
  - If a Docker network has not already been created:
    ```sh
    sudo docker network create shared-network
    ```
  - Then configure the external Postgres container for both networks
    ```yml
    services:
      postgres:
        networks:
          - default
          - shared-network
    ```
    