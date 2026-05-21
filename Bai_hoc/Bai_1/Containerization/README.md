# Containerization and Cloud-native manifests

This folder contains Dockerfiles, a `docker-compose.yml`, and Kubernetes manifests to containerize and run the sample services found in `Tuan_1`.

Structure

- `python/` - Dockerfile and .dockerignore for the FastAPI backend (runs on port 8000)
- `java/` - Dockerfile for the Spring Boot backend (runs on port 8080)
- `blazor/` - Dockerfile for the Blazor WebAssembly client served by nginx (port 80)
- `docker-compose.yml` - compose orchestrator to run all three services locally
- `k8s/` - Kubernetes manifests (Deployment + Service) for each service

Quick local test (Docker Compose)

```bash
cd Tuan_1/Containerization
docker compose build
docker compose up
```

Notes for production / cloud deployment

- Tag and push built images to your container registry (Docker Hub / ACR / ECR), e.g.:

```bash
# Example (replace with your registry)
docker build -t registry.example.com/luxdecor/python-api:latest -f python/Dockerfile ../../Tuan_1/Python
docker push registry.example.com/luxdecor/python-api:latest
```

- Update `image:` fields in `k8s/*.yaml` to point to your pushed images, then deploy with `kubectl apply -f k8s/`.
- Ensure your Kubernetes cluster has ingress or load balancer configured to expose services externally.
- Add secrets, resource limits, and proper readiness/liveness probes as needed.

If you want, I can:

- Build the images here and report results (if Docker is available), or
- Tag/push to a registry you provide, or
- Generate cloud-specific manifests (e.g., Azure Container Instances, Azure App Service, or Helm charts).
