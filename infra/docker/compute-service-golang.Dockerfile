FROM golang:1.22-alpine

WORKDIR /app

COPY backend/compute-service-golang/go.mod ./
COPY backend/compute-service-golang/go.sum ./
RUN go mod download

COPY backend/compute-service-golang ./

EXPOSE 8080

ENV PORT=8080

CMD ["go", "run", "main.go"]
