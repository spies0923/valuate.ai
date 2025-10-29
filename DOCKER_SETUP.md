# Docker Setup Guide for Valuate.ai

This guide explains how to run Valuate.ai using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

To check if you have Docker installed:
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd valuate.ai
```

### 2. Configure Environment Variables
Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```

**Required Variables:**
- `OPENAI_API_KEY`: Your OpenAI API key (get from https://platform.openai.com/api-keys)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key
- `UPLOADTHING_SECRET`: UploadThing secret
- `UPLOADTHING_APP_ID`: UploadThing app ID

**Security:**
- Change `MONGO_ROOT_PASSWORD` to a strong password
- Change `JWT_SECRET` to a random secure string

### 3. Start All Services
```bash
docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Backend Server** on port 8080
- **Frontend Client** on port 3000

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health/detailed

## Docker Compose Commands

### Start Services
```bash
# Start in detached mode (background)
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d mongodb
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 server
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart server
```

### Rebuild Services
```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build server

# Rebuild and start
docker-compose up -d --build
```

## Service Details

### MongoDB (Database)
- **Port:** 27017
- **Volume:** `mongodb_data` (persistent storage)
- **Default Credentials:** admin/changeme (change in .env)
- **Database Name:** valuate

### Server (Backend API)
- **Port:** 8080
- **Technology:** Node.js + Express
- **Volume:** `server_logs` (logs directory)
- **Health Check:** http://localhost:8080/health

### Client (Frontend)
- **Port:** 3000
- **Technology:** Next.js + React
- **Depends on:** Server

## Data Persistence

Data is persisted using Docker volumes:

### View Volumes
```bash
docker volume ls
```

### Backup Database
```bash
# Create backup
docker exec valuate-mongodb mongodump --username admin --password changeme --authenticationDatabase admin --out /backup

# Copy backup to host
docker cp valuate-mongodb:/backup ./mongodb-backup
```

### Restore Database
```bash
# Copy backup to container
docker cp ./mongodb-backup valuate-mongodb:/backup

# Restore
docker exec valuate-mongodb mongorestore --username admin --password changeme --authenticationDatabase admin /backup
```

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common issues:**
- Port already in use: Change ports in .env file
- Missing environment variables: Check .env file
- MongoDB not healthy: Wait longer or check MongoDB logs

### Database Connection Issues

**Check MongoDB is running:**
```bash
docker-compose ps mongodb
```

**Test connection:**
```bash
docker exec valuate-mongodb mongosh --username admin --password changeme --authenticationDatabase admin
```

### Server Can't Connect to MongoDB

**Check network:**
```bash
docker network ls
docker network inspect valuate-network
```

**Verify DB_URL:**
- Should be: `mongodb://admin:password@mongodb:27017/valuate?authSource=admin`
- Use service name `mongodb` not `localhost`

### Client Can't Connect to Server

**Check NEXT_PUBLIC_SERVER_URL:**
- From browser: `http://localhost:8080`
- From container: `http://server:8080`

### Permission Issues

**Fix log directory permissions:**
```bash
sudo chown -R $(id -u):$(id -g) server/logs
```

### Reset Everything

**Remove all containers, volumes, and images:**
```bash
docker-compose down -v
docker-compose rm -f
docker system prune -a
```

Then rebuild:
```bash
docker-compose up -d --build
```

## Development vs Production

### Development
Use the Docker setup for local development:
```bash
# Mount source code for hot reload
docker-compose -f docker-compose.dev.yml up
```

### Production
For production deployment:

1. **Set NODE_ENV:**
   ```bash
   export NODE_ENV=production
   ```

2. **Use strong secrets:**
   - Change all default passwords
   - Use environment-specific .env files

3. **Enable HTTPS:**
   - Use a reverse proxy (Nginx, Caddy)
   - Get SSL certificates (Let's Encrypt)

4. **Resource Limits:**
   Add to docker-compose.yml:
   ```yaml
   services:
     server:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 1G
   ```

5. **Monitoring:**
   - Check `/health/detailed` endpoint
   - Monitor logs regularly
   - Set up alerts

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGO_ROOT_USERNAME | No | admin | MongoDB root username |
| MONGO_ROOT_PASSWORD | No | changeme | MongoDB root password |
| MONGO_PORT | No | 27017 | MongoDB port |
| OPENAI_API_KEY | Yes | - | OpenAI API key |
| SERVER_PORT | No | 8080 | Backend server port |
| CLIENT_PORT | No | 3000 | Frontend client port |
| JWT_SECRET | No | default | JWT signing secret |
| LOG_LEVEL | No | info | Logging level |
| NEXT_PUBLIC_SERVER_URL | No | http://localhost:8080 | Backend API URL |

## Scaling

### Horizontal Scaling
To run multiple instances:

```yaml
services:
  server:
    deploy:
      replicas: 3
```

**Note:** You'll need:
- External MongoDB (not in container)
- Redis for shared cache
- Load balancer

### Vertical Scaling
Increase resources per container:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Best Practices

1. **Never commit .env file**
   - Added to .gitignore
   - Use secrets management in production

2. **Change default credentials**
   - MongoDB password
   - JWT secret

3. **Use non-root user**
   - Already configured in Dockerfiles

4. **Keep images updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

5. **Scan for vulnerabilities**
   ```bash
   docker scan valuate-server
   ```

## CI/CD Integration

### Build Images
```bash
docker build -t valuate-server:latest ./server
docker build -t valuate-client:latest ./client
```

### Push to Registry
```bash
docker tag valuate-server:latest registry.example.com/valuate-server:latest
docker push registry.example.com/valuate-server:latest
```

### Deploy
```bash
docker-compose pull
docker-compose up -d
```

## Health Checks

All services have health checks configured:

### Check Service Health
```bash
# Backend
curl http://localhost:8080/health/detailed

# MongoDB
docker exec valuate-mongodb mongosh --eval "db.adminCommand('ping')"

# All services
docker-compose ps
```

## Performance Optimization

### Build Cache
Use BuildKit for faster builds:
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

### Multi-stage Builds
Already implemented in Dockerfiles:
- Smaller image sizes
- Faster builds
- Better security

### Volume Performance
For better I/O performance on macOS/Windows:
- Use named volumes instead of bind mounts
- Consider Docker Desktop settings

## Cleanup

### Remove Unused Resources
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything
docker system prune -a --volumes
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify health: `docker-compose ps`
3. Review documentation
4. Open an issue on GitHub

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB in Docker](https://hub.docker.com/_/mongo)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
