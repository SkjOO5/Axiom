FROM python:3.11-slim

WORKDIR /app

# Install system build tools for scipy/fairlearn
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ gfortran libopenblas-dev liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pip tools + uvicorn
RUN pip install --upgrade pip setuptools wheel && \
    pip install uvicorn==0.29.0

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# HuggingFace Spaces uses port 7860
EXPOSE 7860

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
