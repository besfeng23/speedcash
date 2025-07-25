# eMango Pay Python Microservice Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY emango_pay_client.py emango_pay_service.py requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy .env if present (for local dev)
COPY .env .env

EXPOSE 5000

CMD ["python", "emango_pay_service.py"] 