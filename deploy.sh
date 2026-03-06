#!/bin/bash

# Quiz Challenge Arena - Docker Deployment Script
# This script helps with building and deploying the application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
check_docker() {
    print_header "Checking Docker Installation"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker $(docker --version)"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose installed"
}

# Check environment variables
check_env() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp .env.example .env
            print_warning "Please edit .env with your production values"
            return 1
        fi
    fi
    
    # Check critical variables
    required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "GROQ_API_KEY" "JWT_SECRET" "SESSION_SECRET")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env 2>/dev/null; then
            print_error "Missing ${var} in .env file"
            return 1
        fi
    done
    
    print_success "All required environment variables found"
}

# Build Docker image
build_image() {
    print_header "Building Docker Image"
    
    IMAGE_NAME="quiz-challenge-arena"
    IMAGE_TAG="${1:-latest}"
    
    print_info "Building $IMAGE_NAME:$IMAGE_TAG..."
    
    if docker build -t "$IMAGE_NAME:$IMAGE_TAG" . ; then
        print_success "Docker image built: $IMAGE_NAME:$IMAGE_TAG"
        
        # Show image size
        IMAGE_SIZE=$(docker images --format "{{.Size}}" "$IMAGE_NAME:$IMAGE_TAG")
        print_info "Image size: $IMAGE_SIZE"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Run container locally
run_local() {
    print_header "Starting Container Locally"
    
    CONTAINER_NAME="quiz-app"
    PORT="${1:-3000}"
    
    # Check if container already running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_warning "Container already running. Stopping..."
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
    fi
    
    print_info "Starting $CONTAINER_NAME on port $PORT:3000..."
    
    if docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:3000" \
        --env-file .env \
        quiz-challenge-arena:latest; then
        
        print_success "Container started successfully"
        sleep 2
        
        # Test health
        if curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; then
            print_success "Health check passed"
            print_info "Application ready at http://localhost:$PORT"
        else
            print_warning "Health check failed - checking logs"
            docker logs "$CONTAINER_NAME" | tail -20
        fi
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Run with docker-compose
run_compose() {
    print_header "Starting with Docker Compose"
    
    print_info "Starting services..."
    
    if docker-compose up -d; then
        print_success "Services started"
        sleep 2
        
        # Show logs
        print_info "Showing logs (last 10 lines)..."
        docker-compose logs app | tail -10
        print_info "Full logs: docker-compose logs -f"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Push to registry
push_image() {
    print_header "Pushing to Docker Registry"
    
    REGISTRY="${1:-dockerhub}"
    USERNAME="${2:-}"
    
    case $REGISTRY in
        dockerhub)
            if [ -z "$USERNAME" ]; then
                read -p "Docker Hub username: " USERNAME
            fi
            print_info "Logging in to Docker Hub..."
            docker login
            docker tag quiz-challenge-arena:latest "$USERNAME/quiz-challenge-arena:latest"
            docker push "$USERNAME/quiz-challenge-arena:latest"
            print_success "Pushed to Docker Hub: $USERNAME/quiz-challenge-arena"
            ;;
        ecr)
            print_info "Push to AWS ECR"
            print_warning "Please run: aws ecr get-login-password | docker login --username AWS --password-stdin <YOUR_ECR_URI>"
            ;;
        *)
            print_error "Unknown registry: $REGISTRY"
            ;;
    esac
}

# Clean up
cleanup() {
    print_header "Cleaning Up"
    
    read -p "Do you want to stop and remove containers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down
        print_success "Containers stopped and removed"
    fi
    
    read -p "Do you want to remove unused images? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker image prune -f
        print_success "Unused images removed"
    fi
}

# Show help
show_help() {
    echo "Usage: ./deploy.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check          - Check Docker and environment setup"
    echo "  build [TAG]    - Build Docker image (default TAG: latest)"
    echo "  run [PORT]     - Run container locally on PORT (default: 3000)"
    echo "  compose        - Run with docker-compose"
    echo "  push [REGISTRY] - Push image to registry (dockerhub, ecr)"
    echo "  logs           - Show container logs"
    echo "  shell          - Open container shell"
    echo "  stop           - Stop running container"
    echo "  clean          - Clean up containers and images"
    echo "  all            - Run all steps: check, build, run"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh check"
    echo "  ./deploy.sh build production"
    echo "  ./deploy.sh run 8080"
    echo "  ./deploy.sh all"
}

# Show logs
show_logs() {
    print_header "Container Logs"
    docker logs -f quiz-app
}

# Open shell
open_shell() {
    print_header "Opening Container Shell"
    
    if ! docker exec -it quiz-app sh; then
        print_error "Container not running"
        exit 1
    fi
}

# Stop container
stop_container() {
    print_header "Stopping Container"
    
    if docker stop quiz-app; then
        print_success "Container stopped"
    else
        print_error "Container not running or failed to stop"
    fi
}

# Main script
main() {
    COMMAND="${1:-help}"
    
    case $COMMAND in
        check)
            check_docker
            check_env
            print_success "All checks passed!"
            ;;
        build)
            check_docker
            build_image "$2"
            ;;
        run)
            check_docker
            check_env
            build_image
            run_local "$2"
            ;;
        compose)
            check_docker
            check_env
            run_compose "$2"
            ;;
        push)
            push_image "$2" "$3"
            ;;
        logs)
            show_logs
            ;;
        shell)
            open_shell
            ;;
        stop)
            stop_container
            ;;
        clean)
            cleanup
            ;;
        all)
            check_docker
            check_env
            build_image
            run_local
            print_header "Deployment Complete"
            print_success "Application is running!"
            print_info "View logs: docker logs -f quiz-app"
            print_info "Open shell: docker exec -it quiz-app sh"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
