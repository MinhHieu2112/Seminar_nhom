FROM python:3.11-slim as base

WORKDIR /app

# Install build deps and runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential && rm -rf /var/lib/apt/lists/*

COPY ../../Tuan_1/Python/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ../../Tuan_1/Python .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
