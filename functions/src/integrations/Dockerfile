# CPay eMango Pay Microservice Dockerfile
# This containerizes the Python Flask service for deployment to Google Cloud Run

FROM python:3.10-slim

# Set metadata labels
LABEL maintainer="CPay Development Team"
LABEL description="eMango Pay integration microservice for CPay platform"
LABEL version="1.0.0"

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Make port 8080 available to the world outside this container
# Cloud Run expects the service to listen on port 8080
EXPOSE 8080

# Define environment variable to tell Flask/gunicorn where to run
ENV PORT=8080
ENV PYTHONPATH=/app
ENV FLASK_APP=emango_pay_service.py
ENV FLASK_ENV=production

# Health check to ensure the service is running correctly
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run the application using gunicorn for production
# gunicorn is a production-grade WSGI HTTP Server
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-connections", "1000", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--timeout", "30", \
     "--keep-alive", "2", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "emango_pay_service:app"] 