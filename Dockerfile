FROM python:3.11-slim

WORKDIR /app

# Install system build tools for scipy/fairlearn (BLAS, Fortran compiler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install uvicorn (guaranteed present)
RUN pip install --upgrade pip setuptools wheel && \
    pip install uvicorn==0.29.0

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source into /app (main.py lands at /app/main.py)
COPY backend/ .

EXPOSE 8000

# Use Python entrypoint (avoids CRLF shell script issues on Linux)
CMD ["python", "/app/run.py"]
