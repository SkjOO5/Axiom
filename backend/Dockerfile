FROM python:3.11.9-slim

WORKDIR /app

# Install system build tools needed for scipy/fairlearn (BLAS, Fortran)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip/setuptools
RUN pip install --upgrade pip setuptools wheel

# Install uvicorn FIRST in its own step to guarantee it's available
RUN pip install uvicorn==0.29.0

# Install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Use exec form with sh to expand $PORT env variable injected by Render
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
